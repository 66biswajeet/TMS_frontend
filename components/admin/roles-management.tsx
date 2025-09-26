"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { RootState } from "@/redux/store"
import { fetchRoles, createRole, updateRole, deleteRole } from "@/redux/modules/roles/actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Search, Plus, Edit, Trash2, Shield } from "lucide-react"

interface Role {
  RoleRankId: string
  Name: string
  Rank: number
}

export function RolesManagement() {
  const dispatch = useDispatch()
  const { items: roles } = useSelector((state: RootState) => state.roles)
  
  useEffect(() => {
    dispatch(fetchRoles() as any)
  }, [dispatch])
  
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    rank: 10,
  })

  const filteredRoles = roles.filter(
    (role) =>
      role.Name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleCreateRole = () => {
    setEditingRole(null)
    setFormData({
      name: "",
      rank: 10,
    })
    setIsDialogOpen(true)
  }

  const handleEditRole = (role: Role) => {
    setEditingRole(role)
    setFormData({
      name: role.Name,
      rank: role.Rank,
    })
    setIsDialogOpen(true)
  }

  const handleDeleteRole = (roleId: string) => {
    if (confirm("Are you sure you want to delete this role?")) {
      dispatch(deleteRole(roleId) as any).then(() => {
        // Refresh the roles list after deleting a role
        dispatch(fetchRoles() as any)
      })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (editingRole) {
      // Update existing role
      dispatch(updateRole(editingRole.RoleRankId, formData) as any).then(() => {
        // Refresh the roles list after updating a role
        dispatch(fetchRoles() as any)
        setIsDialogOpen(false)
      })
    } else {
      // Create new role
      dispatch(createRole(formData) as any).then(() => {
        // Refresh the roles list after creating a new role
        dispatch(fetchRoles() as any)
        setIsDialogOpen(false)
      })
    }
  }

  const getRankColor = (rank: number) => {
    if (rank <= 2) return "default" // Highest ranks (1-2)
    if (rank <= 4) return "secondary" // High ranks (3-4)
    if (rank <= 6) return "outline" // Mid ranks (5-6)
    return "outline" // Lower ranks (7-10)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Roles Management</h1>
          <p className="text-muted-foreground">Manage user roles and permissions</p>
        </div>
        <Button onClick={handleCreateRole}>
          <Plus className="h-4 w-4 mr-2" />
          Add Role
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{roles.length}</div>
            <p className="text-xs text-muted-foreground">Defined roles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Permissions</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">N/A</div>
            <p className="text-xs text-muted-foreground">Available permissions</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Roles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRoles.map((role) => (
          <Card key={role.RoleRankId} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{role.Name}</CardTitle>
                  <div className="mt-2">
                    <Badge variant={getRankColor(role.Rank)} className="text-xs">
                      Rank: {role.Rank}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditRole(role)}
                  className="flex-1 bg-transparent"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteRole(role.RoleRankId)}
                  className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Role Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRole ? "Edit Role" : "Create New Role"}</DialogTitle>
            <DialogDescription>
              {editingRole
                ? "Update role information."
                : "Define a new role."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Role Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rank">Rank (1=Highest, 10=Lowest) *</Label>
              <Input
                id="rank"
                type="number"
                min="1"
                max="10"
                value={formData.rank}
                onChange={(e) => setFormData({ ...formData, rank: Number.parseInt(e.target.value) || 10 })}
                required
              />
              <p className="text-xs text-muted-foreground">1 = Highest authority, 10 = Lowest authority</p>
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
                {editingRole ? "Update Role" : "Create Role"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
