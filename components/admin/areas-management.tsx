"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, Edit, Trash2, MapPin } from "lucide-react"

interface Area {
  AreaId: string
  AreaName: string
  LocationCode: string
  GroupName: string
  IsActive: boolean
  CreatedAt: string
}

export function AreasManagement() {
  const [areas, setAreas] = useState<Area[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingArea, setEditingArea] = useState<Area | null>(null)
  const [formData, setFormData] = useState({
    AreaName: "",
    LocationCode: "",
    GroupName: "",
    IsActive: true,
  })

  // Fetch areas from API
  const fetchAreas = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/areas')
      const data = await response.json()
      setAreas(data.items || [])
      setError(null)
    } catch (err) {
      setError("Failed to fetch areas")
      console.error("Error fetching areas:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAreas()
  }, [])

  const filteredAreas = areas.filter((area) => {
    const matchesSearch =
      area.AreaName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      area.GroupName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "active" && area.IsActive) ||
      (statusFilter === "inactive" && !area.IsActive)

    return matchesSearch && matchesStatus
  })

  const handleCreateArea = () => {
    setEditingArea(null)
    setFormData({
      AreaName: "",
      LocationCode: "",
      GroupName: "",
      IsActive: true,
    })
    setIsDialogOpen(true)
  }

  const handleEditArea = (area: Area) => {
    setEditingArea(area)
    setFormData({
      AreaName: area.AreaName,
      LocationCode: area.LocationCode || "",
      GroupName: area.GroupName || "",
      IsActive: area.IsActive,
    })
    setIsDialogOpen(true)
  }

  const handleDeleteArea = (areaId: string) => {
    if (confirm("Are you sure you want to delete this area?")) {
      // TODO: Implement delete area API call
      console.log("Delete area:", areaId)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingArea) {
        // Update existing area
        const response = await fetch(`/api/areas/${editingArea.AreaId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        })

        if (response.ok) {
          fetchAreas()
          setIsDialogOpen(false)
        } else {
          console.error("Failed to update area")
        }
      } else {
        // Create new area
        const response = await fetch('/api/areas', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        })

        if (response.ok) {
          fetchAreas()
          setIsDialogOpen(false)
        } else {
          console.error("Failed to create area")
        }
      }
    } catch (err) {
      console.error("Error saving area:", err)
    }
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive ? "default" : "secondary"
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
          <h1 className="text-3xl font-bold text-foreground">Areas Management</h1>
          <p className="text-muted-foreground">Manage pharmacy area locations and details</p>
        </div>
        <Button onClick={handleCreateArea}>
          <Plus className="h-4 w-4 mr-2" />
          Add Area
        </Button>
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
                placeholder="Search areas..."
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

      {/* Areas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAreas.map((area) => (
          <Card key={area.AreaId} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{area.AreaName}</CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" />
                    {area.GroupName}
                  </CardDescription>
                </div>
                <Badge variant={getStatusColor(area.IsActive)} className="text-xs">
                  {area.IsActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">Location Code: {area.LocationCode || "N/A"}</p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditArea(area)}
                  className="flex-1 bg-transparent"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteArea(area.AreaId)}
                  className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
              -+
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Area Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingArea ? "Edit Area" : "Create New Area"}</DialogTitle>
            <DialogDescription>
              {editingArea ? "Update area information and details." : "Add a new pharmacy area location."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="AreaName">Area Name *</Label>
              <Input
                id="AreaName"
                value={formData.AreaName}
                onChange={(e) => setFormData({ ...formData, AreaName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="LocationCode">Location Code</Label>
              <Input
                id="LocationCode"
                value={formData.LocationCode}
                onChange={(e) => setFormData({ ...formData, LocationCode: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="GroupName">Group Name *</Label>
              <Input
                id="GroupName"
                value={formData.GroupName}
                onChange={(e) => setFormData({ ...formData, GroupName: e.target.value })}
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
                {editingArea ? "Update Area" : "Create Area"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}