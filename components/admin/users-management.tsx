"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { RootState } from "@/redux/store"
import { fetchUsersMinimal, createUser, updateUser, deleteUser } from "@/redux/modules/users/actions"
import { fetchBranches } from "@/redux/modules/branches/actions"
import { fetchPositions } from "@/redux/modules/positions/actions"
import { fetchRoles } from "@/redux/modules/roles/actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Search, Plus, Edit, Trash2, Users, UserCheck, Building } from "lucide-react"

interface User {
  id: string
  name: string
  email: string
  password?: string
  phone: string
  emiratesId: string
  gender: "male" | "female" | "other"
  staffId: string
  role: "staff" | "branch_manager" | "area_manager" | "auditor" | "management" | "admin"
  position: string
  rank: number
  branch: string
  status: "active" | "inactive"
  lastLogin: string
  createdAt: string
}

// Define role-specific positions mapping
const ROLE_POSITIONS = {
  staff: [
    "Pharmacist",
    "Assistant Pharmacist",
    "Pharmacy Technician",
    "Cashier",
    "Inventory Clerk",
    "Customer Service Representative"
  ],
  branch_manager: [
    "Branch Manager",
    "Pharmacy Manager"
  ],
  area_manager: [
    "Area Manager",
    "Regional Supervisor"
  ],
  auditor: [
    "Quality Control Supervisor",
    "Compliance Auditor",
    "Regulatory Inspector"
  ],
  management: [
    "Chief Executive Officer (CEO)",
    "Owner",
    "Operations Director",
    "Pharmacy Director"
  ],
  admin: [
    "System Administrator",
    "IT Manager"
  ]
}

export function UsersManagement() {
  const dispatch = useDispatch()
  const { items: users, loading, error } = useSelector((state: RootState) => state.users)
  const { items: branches } = useSelector((state: RootState) => state.branches)
  const { items: positions } = useSelector((state: RootState) => state.positions)
  const { items: roles } = useSelector((state: RootState) => state.roles)
  
  useEffect(() => {
    dispatch(fetchUsersMinimal() as any)
    dispatch(fetchBranches() as any)
    dispatch(fetchPositions() as any)
    dispatch(fetchRoles() as any)
  }, [dispatch])

  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [branchFilter, setBranchFilter] = useState<string>("all")
  const [positionFilter, setPositionFilter] = useState<string>("all")

  // Re-fetch users when branch filter changes
  useEffect(() => {
    if (branchFilter === "all") {
      dispatch(fetchUsersMinimal() as any)
    } else {
      // Find the branch ID from branch name
      const selectedBranch = branches.find((b: any) => b.BranchName === branchFilter);
      if (selectedBranch) {
        dispatch(fetchUsersMinimal(selectedBranch.BranchId) as any)
      }
    }
  }, [branchFilter, branches, dispatch])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    emiratesId: "",
    gender: "",
    staffId: "",
    role: "",
    position: "",
    rank: 10,
    status: "active",
  })

  // Get filtered positions based on selected role
  const getFilteredPositions = (selectedRole: string) => {
    if (!selectedRole) return positions
    
    const rolePositions = ROLE_POSITIONS[selectedRole as keyof typeof ROLE_POSITIONS] || []
    
    // Filter actual positions that match the role-specific ones
    return positions.filter((position: any) =>
      rolePositions.some(rolePosName =>
        position.Name.toLowerCase().includes(rolePosName.toLowerCase()) ||
        rolePosName.toLowerCase().includes(position.Name.toLowerCase())
      )
    )
  }

  // First check if there's an exact Staff ID match to prioritize it
  const hasExactStaffIdMatch = searchTerm.trim() && users.some((user: any) =>
    (user.staffId || "").toLowerCase() === searchTerm.toLowerCase().trim()
  )

  const filteredUsers = users.filter((user: any) => {
    const searchLower = searchTerm.toLowerCase().trim()
    const userStaffId = (user.staffId || "").toLowerCase()
    
    // Apply filters
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    const matchesStatus = statusFilter === "all" || user.status === statusFilter
    const matchesBranch = branchFilter === "all" || user.branch === branchFilter
    // Fix position filtering - handle null positions correctly
    const userPosition = user.position || ""
    const matchesPosition = positionFilter === "all" || userPosition === positionFilter
    
    // If no search term, just apply filters
    if (!searchTerm.trim()) {
      return matchesRole && matchesStatus && matchesBranch && matchesPosition
    }
    
    // If there's an exact Staff ID match, ONLY show that user
    if (hasExactStaffIdMatch) {
      return userStaffId === searchLower && matchesRole && matchesStatus && matchesBranch && matchesPosition
    }
    
    // Otherwise use inclusive search across all fields
    const matchesSearch = (
      (user.name || "").toLowerCase().includes(searchLower) ||
      (user.email || "").toLowerCase().includes(searchLower) ||
      (user.phone || "").toLowerCase().includes(searchLower) ||
      userStaffId.includes(searchLower) ||
      (user.emiratesId || "").toLowerCase().includes(searchLower)
    )

    return matchesSearch && matchesRole && matchesStatus && matchesBranch && matchesPosition
  })

  // Handle role change and reset position if it's not valid for the new role
  const handleRoleChange = (newRole: string) => {
    const updatedFormData = { ...formData, role: newRole }
    
    // Check if current position is valid for the new role
    const filteredPositions = getFilteredPositions(newRole)
    const isCurrentPositionValid = filteredPositions.some((pos: any) => pos.Name === formData.position)
    
    // Reset position if it's not valid for the new role
    if (!isCurrentPositionValid) {
      updatedFormData.position = ""
    }
    
    setFormData(updatedFormData)
  }

  const handleCreateUser = () => {
    setEditingUser(null)
    setFormData({
      name: "",
      email: "",
      password: "",
      phone: "",
      emiratesId: "",
      gender: "",
      staffId: "",
      role: "",
      position: "",
      rank: 10,
      status: "active",
    })
    setIsDialogOpen(true)
  }

  const handleEditUser = (user: any) => {
    console.log('[Frontend] Editing user:', user);
    console.log('[Frontend] User gender:', user.gender, 'type:', typeof user.gender);
    
    setEditingUser(user)
    
    const newFormData = {
      name: user.name,
      email: user.email,
      password: "", // Don't populate password for security
      phone: user.phone,
      emiratesId: user.emiratesId,
      gender: user.gender?.toLowerCase() || "", // Normalize gender to lowercase
      staffId: user.staffId,
      role: user.role,
      position: user.position,
      rank: user.rank,
      status: user.status,
    };
    
    console.log('[Frontend] Setting form data:', newFormData);
    console.log('[Frontend] Normalized gender:', newFormData.gender);
    
    setFormData(newFormData)
    setIsDialogOpen(true)
  }

  const handleDeleteUser = (userId: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      dispatch(deleteUser(userId) as any)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Map frontend form data to backend expected structure
    const backendData: any = {
      fullName: formData.name,
      email: formData.email,
      phone: formData.phone,
      emiratesId: formData.emiratesId,
      gender: formData.gender,
      password: formData.password,
      staffId: formData.staffId,
      positionId: positions.find((p: any) => p.Name === formData.position)?.PositionId,
      isActive: formData.status === "active",
    }

    // Map role to roleRankId - get rank from role, not from form input
    const selectedRole = roles.find((r: any) => r.Name === formData.role);
    if (selectedRole) {
      backendData.roleRankId = selectedRole.RoleRankId;
    }

    // Branch assignment will be handled separately, not during user creation
    // Remove branchIds from user creation payload

    if (editingUser) {
      // Update existing user
      dispatch(updateUser(editingUser.id, backendData) as any)
    } else {
      // Create new user
      dispatch(createUser(backendData) as any)
    }

    setIsDialogOpen(false)
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
      case "management":
        return "default"
      case "area_manager":
      case "branch_manager":
        return "secondary"
      case "auditor":
        return "outline"
      case "staff":
        return "outline"
      default:
        return "outline"
    }
  }

  const getRankColor = (rank: number) => {
    if (rank <= 2) return "default" // Highest ranks (1-2)
    if (rank <= 4) return "secondary" // High ranks (3-4)
    if (rank <= 6) return "outline" // Mid ranks (5-6)
    return "outline" // Lower ranks (7-10)
  }

  const formatDate = (dateString: string) => {
    if (dateString === "Never") return "Never"
    return new Date(dateString).toLocaleDateString()
  }

  const formatLastLogin = (dateString: string) => {
    if (dateString === "Never") return "Never"
    const date = new Date(dateString)
    const now = new Date()
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffHours < 24) {
      return `${diffHours}h ago`
    } else {
      const diffDays = Math.floor(diffHours / 24)
      return `${diffDays}d ago`
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  if (error) {
    return <div className="flex justify-center items-center h-64 text-red-600">Error: {error}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Users Management</h1>
          <p className="text-muted-foreground">Manage user accounts and permissions</p>
        </div>
        <Button onClick={handleCreateUser}>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{users.length}</div>
            <p className="text-xs text-muted-foreground">Registered accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{users.filter((u: any) => u.status === "active").length}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Managers</CardTitle>
            <Building className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {users.filter((u: any) => u.role.includes("manager") || u.role === "management").length}
            </div>
            <p className="text-xs text-muted-foreground">Management roles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{users.filter((u: any) => u.role === "staff").length}</div>
            <p className="text-xs text-muted-foreground">Staff members</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, phone, staff ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="branch_manager">Branch Manager</SelectItem>
                <SelectItem value="area_manager">Area Manager</SelectItem>
                <SelectItem value="auditor">Auditor</SelectItem>
                <SelectItem value="management">Management</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>

            <Select value={positionFilter} onValueChange={setPositionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Positions</SelectItem>
                {positions.map((position: any) => (
                  <SelectItem key={position.PositionId} value={position.Name}>
                    {position.Name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
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
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Manage user accounts, roles, and permissions</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left p-4 font-medium">User</th>
                  <th className="text-left p-4 font-medium">Role</th>
                  <th className="text-left p-4 font-medium">Position</th>
                  <th className="text-left p-4 font-medium">Rank</th>
                  <th className="text-left p-4 font-medium">Branch</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Last Login</th>
                  <th className="text-left p-4 font-medium">Created</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user: any, index: number) => {
                  // Create a unique key using userId, email, and index to handle duplicates
                  const uniqueKey = `${user.id}-${user.email}-${index}`;

                  return (
                    <tr key={uniqueKey} className="border-b hover:bg-muted/50">
                    <td className="p-4">
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                        <div className="text-xs text-muted-foreground">
                          ID: {user.staffId} • {user.phone}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant={getRoleColor(user.role)} className="text-xs">
                        {user.role.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm">{user.position}</td>
                    <td className="p-4">
                      <Badge variant={getRankColor(user.rank)} className="text-xs">
                        {user.rank}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm">{user.branch}</td>
                    <td className="p-4">
                      <Badge variant={user.status === "active" ? "default" : "secondary"} className="text-xs">
                        {user.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm">{formatLastLogin(user.lastLogin)}</td>
                    <td className="p-4 text-sm">{formatDate(user.createdAt)}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                 );
               })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* User Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Edit User" : "Create New User"}</DialogTitle>
            <DialogDescription>
              {editingUser
                ? "Update user information and permissions."
                : "Add a new user to the system with complete profile information."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            {!editingUser && (
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  placeholder="Enter initial password"
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+971501234567"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emiratesId">Emirates ID</Label>
                <Input
                  id="emiratesId"
                  value={formData.emiratesId}
                  onChange={(e) => setFormData({ ...formData, emiratesId: e.target.value })}
                  placeholder="784-YYYY-XXXXXXX-X"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
                <Select
                  key={editingUser ? `gender-${editingUser.id}` : 'gender-new'}
                  value={formData.gender}
                  onValueChange={(value) => setFormData({ ...formData, gender: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="staffId">Staff ID</Label>
                <Input
                  id="staffId"
                  value={formData.staffId}
                  onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                  placeholder="PH001, BM001, etc."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select value={formData.role} onValueChange={handleRoleChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="branch_manager">Branch Manager</SelectItem>
                    <SelectItem value="area_manager">Area Manager</SelectItem>
                    <SelectItem value="auditor">Auditor</SelectItem>
                    <SelectItem value="management">Management</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Select
                  value={formData.position}
                  onValueChange={(value) => setFormData({ ...formData, position: value })}
                  disabled={!formData.role}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={formData.role ? "Select position" : "Select role first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {getFilteredPositions(formData.role).map((position: any) => (
                      <SelectItem key={position.PositionId} value={position.Name}>
                        {position.Name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.role && (
                  <p className="text-xs text-muted-foreground">
                    Showing positions for {formData.role.replace('_', ' ')} role
                  </p>
                )}
              </div>
              
            </div>

            {/* Rank is now determined by role, not manually set */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                Rank will be automatically assigned based on the selected role
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="flex-1 bg-transparent"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                {editingUser ? "Update User" : "Create User"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
