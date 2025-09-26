"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { RootState } from "@/redux/store"
import { fetchPositions, createPosition, updatePosition, deletePosition } from "@/redux/modules/positions/actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, Edit, Trash2, Briefcase, Users, CheckCircle } from "lucide-react"
import { showError, showSuccess, showWarning } from "@/lib/toast"

interface Position {
  PositionId: string
  Name: string
  IsActive: boolean
  CreatedAt?: string
}

// Define role-specific positions mapping
const ROLE_POSITIONS = {
  staff: [
    { id: "pharmacist", name: "Pharmacist" },
    { id: "assistant_pharmacist", name: "Assistant Pharmacist" },
    { id: "pharmacy_technician", name: "Pharmacy Technician" },
    { id: "cashier", name: "Cashier" },
    { id: "inventory_clerk", name: "Inventory Clerk" },
    { id: "customer_service", name: "Customer Service Representative" }
  ],
  branch_manager: [
    { id: "branch_manager", name: "Branch Manager" },
    { id: "pharmacy_manager", name: "Pharmacy Manager" }
  ],
  area_manager: [
    { id: "area_manager", name: "Area Manager" },
    { id: "regional_supervisor", name: "Regional Supervisor" }
  ],
  auditor: [
    { id: "quality_control_supervisor", name: "Quality Control Supervisor" },
    { id: "compliance_auditor", name: "Compliance Auditor" },
    { id: "regulatory_inspector", name: "Regulatory Inspector" }
  ],
  management: [
    { id: "ceo", name: "Chief Executive Officer (CEO)" },
    { id: "owner", name: "Owner" },
    { id: "operations_director", name: "Operations Director" },
    { id: "pharmacy_director", name: "Pharmacy Director" }
  ],
  admin: [
    { id: "system_administrator", name: "System Administrator" },
    { id: "it_manager", name: "IT Manager" }
  ]
}

export function PositionsManagement() {
  const dispatch = useDispatch()
  const { items: positions, loading, error } = useSelector((state: RootState) => state.positions)
  
  useEffect(() => {
    dispatch(fetchPositions() as any)
  }, [dispatch])
  
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isRolePositionsDialogOpen, setIsRolePositionsDialogOpen] = useState(false)
  const [editingPosition, setEditingPosition] = useState<Position | null>(null)
  const [selectedRole, setSelectedRole] = useState<string>("")
  const [formData, setFormData] = useState({
    Name: "",
    IsActive: true,
  })

  const filteredPositions = positions.filter((position: any) => {
    const matchesSearch = position.Name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "active" && position.IsActive) ||
      (statusFilter === "inactive" && !position.IsActive)

    return matchesSearch && matchesStatus
  })

  // Get positions for a specific role
  const getPositionsForRole = (role: string) => {
    return ROLE_POSITIONS[role as keyof typeof ROLE_POSITIONS] || []
  }

  // Handle bulk create positions for a role
  const handleCreateRolePositions = async (role: string) => {
    const rolePositions = getPositionsForRole(role)
    
    try {
      for (const pos of rolePositions) {
        // Check if position already exists
        const existingPosition = positions.find((p: any) => 
          p.Name.toLowerCase() === pos.name.toLowerCase()
        )
        
        if (!existingPosition) {
          await dispatch(createPosition({ Name: pos.name, IsActive: true }) as any)
        }
      }
      
      showSuccess(`Positions for ${role.replace('_', ' ')} role have been created successfully!`)
      setIsRolePositionsDialogOpen(false)
    } catch (error) {
      console.error('Failed to create role positions:', error)
      showError('Failed to create some positions. Please try again.')
    }
  }

  const handleCreatePosition = () => {
    setEditingPosition(null)
    setFormData({
      Name: "",
      IsActive: true,
    })
    setIsDialogOpen(true)
  }

  const handleEditPosition = (position: any) => {
    setEditingPosition(position)
    setFormData({
      Name: position.Name,
      IsActive: position.IsActive,
    })
    setIsDialogOpen(true)
  }

  const handleDeletePosition = (positionId: string) => {
    if (confirm("Are you sure you want to delete this position?")) {
      dispatch(deletePosition(positionId) as any)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (editingPosition) {
      // Update existing position
      dispatch(updatePosition(editingPosition.PositionId, formData) as any).then(() => {
        setIsDialogOpen(false)
      })
    } else {
      // Create new position
      dispatch(createPosition(formData) as any).then(() => {
        setIsDialogOpen(false)
      })
    }
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive ? "default" : "secondary"
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString()
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
          <h1 className="text-3xl font-bold text-foreground">Positions Management</h1>
          <p className="text-muted-foreground">Manage job positions and role-specific assignments</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsRolePositionsDialogOpen(true)}
          >
            <Briefcase className="h-4 w-4 mr-2" />
            Create Role Positions
          </Button>
          <Button onClick={handleCreatePosition}>
            <Plus className="h-4 w-4 mr-2" />
            Add Position
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Positions</CardTitle>
            <Briefcase className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{positions.length}</div>
            <p className="text-xs text-muted-foreground">Job positions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Positions</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {positions.filter((p: any) => p.IsActive).length}
            </div>
            <p className="text-xs text-muted-foreground">Currently available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Management Roles</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {positions.filter((p: any) => 
                p.Name.toLowerCase().includes('manager') || 
                p.Name.toLowerCase().includes('ceo') ||
                p.Name.toLowerCase().includes('director') ||
                p.Name.toLowerCase().includes('owner')
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">Leadership positions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff Roles</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {positions.filter((p: any) => 
                p.Name.toLowerCase().includes('pharmacist') || 
                p.Name.toLowerCase().includes('technician') ||
                p.Name.toLowerCase().includes('cashier') ||
                p.Name.toLowerCase().includes('clerk')
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">Operational roles</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search positions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

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
          </div>
        </CardContent>
      </Card>

      {/* Positions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Positions</CardTitle>
          <CardDescription>Manage job positions and role assignments</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left p-4 font-medium">Position Name</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Created Date</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPositions.map((position: any) => (
                  <tr key={position.PositionId} className="border-b hover:bg-muted/50">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{position.Name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant={getStatusColor(position.IsActive)} className="text-xs">
                        {position.IsActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {formatDate(position.CreatedAt)}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditPosition(position)}>
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePosition(position.PositionId)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
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

      {/* Position Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPosition ? "Edit Position" : "Create New Position"}</DialogTitle>
            <DialogDescription>
              {editingPosition 
                ? "Update position information." 
                : "Add a new job position to the system."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="Name">Position Name *</Label>
              <Input
                id="Name"
                value={formData.Name}
                onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
                placeholder="e.g. Pharmacist, Branch Manager, etc."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="IsActive">Status</Label>
              <Select 
                value={formData.IsActive ? "active" : "inactive"} 
                onValueChange={(value) => setFormData({ ...formData, IsActive: value === "active" })}
              >
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
                {editingPosition ? "Update Position" : "Create Position"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Role Positions Dialog */}
      <Dialog open={isRolePositionsDialogOpen} onOpenChange={setIsRolePositionsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Role-Specific Positions</DialogTitle>
            <DialogDescription>
              Select a role to automatically create its standard positions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(ROLE_POSITIONS).map(([role, rolePositions]) => (
                <Card key={role} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg capitalize">
                      {role.replace('_', ' ')} Positions
                    </CardTitle>
                    <CardDescription>
                      {rolePositions.length} standard positions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1">
                      {rolePositions.slice(0, 3).map((pos) => (
                        <div key={pos.id} className="text-sm text-muted-foreground flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          {pos.name}
                        </div>
                      ))}
                      {rolePositions.length > 3 && (
                        <div className="text-sm text-muted-foreground">
                          +{rolePositions.length - 3} more...
                        </div>
                      )}
                    </div>
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleCreateRolePositions(role)}
                    >
                      Create {role.replace('_', ' ')} Positions
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}