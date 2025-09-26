"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Plus, Trash2, GripVertical } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { api } from "@/lib/axios"

interface ChecklistItem {
  id: number
  text: string
}

export function TemplateCreation() {
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "general",
    priority: "medium",
    scope: "",
  })
  
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([{ id: 1, text: "" }])
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const addChecklistItem = () => {
    const newId = Math.max(...checklistItems.map((item) => item.id), 0) + 1
    setChecklistItems([...checklistItems, { id: newId, text: "" }])
  }
  
  const removeChecklistItem = (id: number) => {
    if (checklistItems.length > 1) {
      setChecklistItems(checklistItems.filter((item) => item.id !== id))
    }
  }
  
  const updateChecklistItem = (id: number, text: string) => {
    setChecklistItems(checklistItems.map((item) => (item.id === id ? { ...item, text } : item)))
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isSubmitting) return
    
    setIsSubmitting(true)
    
    try {
      const templateData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        scope: formData.scope,
        items: checklistItems.filter((item) => item.text.trim() !== ""),
      }
      
      await api.post("/templates", templateData)
      router.push("/templates")
    } catch (error) {
      console.error("Failed to create template:", error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const isFormValid = () => {
    return (
      formData.name && formData.name.trim() !== "" &&
      formData.scope && formData.scope !== "" &&
      checklistItems.some((item) => item.text && item.text.trim() !== "")
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/templates">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">Create New Template</h1>
          <p className="text-muted-foreground">Create a reusable template for your pharmacy operations</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Template Information</CardTitle>
            <CardDescription>Enter the main details for your template</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter template name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                    <SelectItem value="inventory">Inventory</SelectItem>
                    <SelectItem value="daily-ops">Daily Operations</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the purpose of this template (optional)"
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scope">Scope *</Label>
                <Select value={formData.scope} onValueChange={(value) => setFormData({ ...formData, scope: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select scope" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Checklist Builder */}
        <Card>
          <CardHeader>
            <CardTitle>Checklist Builder</CardTitle>
            <CardDescription>Create a checklist of items that will be included in this template</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {checklistItems.map((item, index) => (
              <div key={item.id} className="flex items-center gap-3">
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                <div className="flex-1">
                  <Input
                    placeholder={`Checklist item ${index + 1}`}
                    value={item.text}
                    onChange={(e) => updateChecklistItem(item.id, e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeChecklistItem(item.id)}
                  disabled={checklistItems.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            <Button type="button" variant="outline" onClick={addChecklistItem} className="w-full bg-transparent">
              <Plus className="h-4 w-4 mr-2" />
              Add Checklist Item
            </Button>
          </CardContent>
        </Card>
        
        {/* Actions */}
        <div className="flex gap-4">
          <Link href="/templates" className="flex-1">
            <Button type="button" variant="outline" className="w-full bg-transparent">
              Cancel
            </Button>
          </Link>
          <Button type="submit" className="flex-1" disabled={!isFormValid() || isSubmitting}>
            {isSubmitting ? "Creating Template..." : "Create Template"}
          </Button>
        </div>
      </form>
    </div>
  )
}