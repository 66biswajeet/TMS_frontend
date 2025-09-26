"use client"

import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { RootState } from "@/redux/store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Trash2, Copy, Search } from "lucide-react"
import Link from "next/link"
import { fetchTemplates, deleteTemplate, duplicateTemplate } from "@/redux/modules/templates/actions"

interface TaskTemplate {
  TemplateId: string
  Name: string
  Description?: string
  Scope: string
  Priority?: string
  Items: number
  Category?: string
  CreatedAt: string
}

export function TemplateManagement() {
  const dispatch = useDispatch()
  const { items: templates, error } = useSelector((state: RootState) => state.templates)
  
  useEffect(() => {
    dispatch(fetchTemplates() as any)
  }, [dispatch])
  
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  
  const handleDeleteTemplate = (templateId: string) => {
    if (confirm("Are you sure you want to delete this template?")) {
      dispatch(deleteTemplate(templateId) as any)
    }
  }
  
  const handleDuplicateTemplate = (templateId: string) => {
    dispatch(duplicateTemplate(templateId) as any)
  }
  
  const filteredTemplates = templates.filter((template: any) => {
    const matchesSearch =
      (template.Name && template.Name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (template.Description && template.Description.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === "all" || (template.Category && template.Category === selectedCategory)
    return matchesSearch && matchesCategory
  })
  
  const categories = ["all", "general", "compliance", "inventory", "daily-ops", "maintenance"]
  
  const getPriorityColor = (priority?: string) => {
    if (!priority) return "bg-gray-100 text-gray-800";
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }
  
  const getCategoryColor = (category?: string) => {
    if (!category) return "bg-gray-100 text-gray-800";
    switch (category) {
      case "compliance":
        return "bg-blue-100 text-blue-800"
      case "inventory":
        return "bg-purple-100 text-purple-800"
      case "daily-ops":
        return "bg-emerald-100 text-emerald-800"
      case "maintenance":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }
  
  if (error) {
    return <div className="flex justify-center items-center h-64 text-red-600">Error: {error}</div>
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/tasks">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">Task Templates</h1>
          <p className="text-muted-foreground">Manage reusable task templates for your pharmacy operations</p>
        </div>
        <Link href="/templates/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create New Template
          </Button>
        </Link>
      </div>
      
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={selectedCategory !== category ? "bg-transparent" : ""}
                >
                  {category === "all" ? "All" : category.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              No templates found. Create your first template from the task creation page.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template: any) => (
            <Card key={template.TemplateId} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{template.Name}</CardTitle>
                    {template.Description && <CardDescription className="mt-1 line-clamp-2">{template.Description}</CardDescription>}
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap mt-3">
                  {template.Category && (
                    <Badge variant="secondary" className={getCategoryColor(template.Category)}>
                      {template.Category.replace("-", " ")}
                    </Badge>
                  )}
                  {template.Priority && (
                    <Badge variant="secondary" className={getPriorityColor(template.Priority)}>
                      {template.Priority} priority
                    </Badge>
                  )}
                  <Badge variant="outline">{template.Scope}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Checklist Items ({template.Items})
                    </p>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Link href={`/tasks/create?template=${template.TemplateId}`} className="flex-1">
                      <Button size="sm" className="w-full">
                        Use Template
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDuplicateTemplate(template.TemplateId)}
                      className="bg-transparent"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteTemplate(template.TemplateId)}
                      className="bg-transparent text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
