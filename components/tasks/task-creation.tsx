"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Save,
  FileText,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchUsersMinimal } from "@/redux/modules/users/actions";
import { fetchBranches } from "@/redux/modules/branches/actions";
import { api } from "@/lib/axios";

interface ChecklistItem {
  id: number;
  text: string;
}

interface TaskTemplate {
  TemplateId: string;
  Name: string;
  Description: string;
  Scope: string;
  Priority: string;
  Items: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  rank: number;
}

interface Branch {
  BranchId: string;
  BranchName: string;
  LocationCode: string;
  GroupName: string;
  IsActive: boolean;
}

export function TaskCreation() {
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get current user from auth state
  const { user: currentUser } = useSelector((state: RootState) => state.auth);

  // Get users and branches from Redux store
  const { items: users } = useSelector((state: RootState) => state.users);
  const { items: branches } = useSelector((state: RootState) => state.branches);

  useEffect(() => {
    // Fetch users and branches when component mounts
    dispatch(fetchUsersMinimal() as any);
    dispatch(fetchBranches() as any);
  }, [dispatch]);

  // Auto-select branch for roles with restrictions
  useEffect(() => {
    if (
      currentUser?.role === "branch_manager" &&
      branches.length > 0 &&
      !formData.branchIds
    ) {
      // For branch managers, we need to find their assigned branch
      // This will be handled by the backend validation, but for now we'll use the first branch
      // In a real implementation, you'd fetch the user's assigned branch from the API
      setFormData((prev) => ({ ...prev, branchId: branches[0].BranchId }));
    } else if (
      currentUser?.role === "staff" &&
      branches.length === 1 &&
      !formData.branchIds
    ) {
      setFormData((prev) => ({ ...prev, branchId: branches[0].BranchId }));
    }
  }, [branches, currentUser]);

  // State for branch users
  const [branchUsers, setBranchUsers] = useState<User[]>([]);
  const [loadingBranchUsers, setLoadingBranchUsers] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    scope: "",
    deadline: "",
    startTime: "",
    endTime: "",
    branchIds: [] as string[],
    assigneeIds: [] as string[],
    priority: "medium",
    isRepeating: false,
    repeatFrequency: "daily",
    repeatEndDate: "",
    repeatCount: 30,
  });

  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([
    { id: 1, text: "" },
  ]);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateCategory, setTemplateCategory] = useState("general");

  const [searchTerm, setSearchTerm] = useState("");

  // Fetch users in a branch
  // const fetchUsersInBranch = async (branchId: string) => {
  //   if (!branchId) {
  //     setBranchUsers([])
  //     return
  //   }

  //   setLoadingBranchUsers(true)
  //   try {
  //     const response = await api.get(`/branches/${branchId}/users`)
  //     setBranchUsers(response.data.items || [])
  //   } catch (error) {
  //     console.error('Failed to fetch users in branch:', error)
  //     setBranchUsers([])
  //   } finally {
  //     setLoadingBranchUsers(false)
  //   }
  // }

  const fetchUsersInBranches = async (branchIds: string[]) => {
    if (!branchIds || branchIds.length === 0) {
      setBranchUsers([]);
      return;
    }
    setLoadingBranchUsers(true);
    try {
      const results = await Promise.all(
        branchIds.map((id) => api.get(`/branches/${id}/users`))
      );
      const all = results.flatMap((r) => r.data.items || []);
      const keyed: Record<string, any> = {};
      all.forEach((u) => {
        const id = u.id || u.UserId;
        keyed[id] = u;
      });
      setBranchUsers(Object.values(keyed));
    } catch (error) {
      console.error("Failed to fetch users in branches:", error);
      setBranchUsers([]);
    } finally {
      setLoadingBranchUsers(false);
    }
  };

  // Filter users based on search term, branch, and role permissions
  const filteredUsers = (() => {
    let availableUsers: any[] = [];

    // For branch managers: only show staff in their assigned branch
    if (currentUser?.role === "branch_manager") {
      // Branch managers can only see staff from their auto-assigned branch
      availableUsers = branchUsers.filter(
        (user: any) =>
          user.RoleRank === 5 && // Only staff (rank 5)
          (user.FullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.Email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    // For area managers: show staff from branches they manage
    else if (currentUser?.role === "area_manager") {
      if (formData.branchIds) {
        availableUsers = branchUsers.filter(
          (user: any) =>
            user.RoleRank >= 4 && // Staff and branch managers
            (user.FullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
              user.Email.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      } else {
        availableUsers = users.filter(
          (user: any) =>
            user.rank >= 4 && // Staff and branch managers
            (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              user.email.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }
    }
    // For auditors: show all users they can audit
    else if (currentUser?.role === "auditor") {
      if (formData.branchIds) {
        availableUsers = branchUsers.filter(
          (user: any) =>
            user.RoleRank >= 3 && // Area managers, branch managers, and staff
            (user.FullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
              user.Email.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      } else {
        availableUsers = users.filter(
          (user: any) =>
            user.rank >= 3 && // Area managers, branch managers, and staff
            (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              user.email.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }
    }
    // For management: show all users
    else if (currentUser?.role === "management") {
      if (formData.branchIds) {
        availableUsers = branchUsers.filter(
          (user: any) =>
            user.FullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.Email.toLowerCase().includes(searchTerm.toLowerCase())
        );
      } else {
        availableUsers = users.filter(
          (user: any) =>
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
    }
    // Default fallback
    else {
      if (formData.branchIds) {
        availableUsers = branchUsers.filter(
          (user: any) =>
            user.FullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.Email.toLowerCase().includes(searchTerm.toLowerCase())
        );
      } else {
        availableUsers = users.filter(
          (user: any) =>
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
    }

    return availableUsers;
  })();

  // Fetch branch users when branch changes
  useEffect(() => {
    fetchUsersInBranches(formData.branchIds);
  }, [formData.branchIds]);

  useEffect(() => {
    // Fetch templates from backend
    const fetchTemplates = async () => {
      try {
        const response = await api.get("/templates");
        setTemplates(response.data.items || []);

        // Check if template parameter is in URL and auto-load it
        const templateParam = searchParams.get("template");
        if (templateParam) {
          setSelectedTemplate(templateParam);
          // Auto-load the template after templates are fetched
          setTimeout(() => {
            loadTemplate(templateParam);
          }, 100);
        }
      } catch (error) {
        console.error("Failed to fetch templates:", error);
      }
    };

    fetchTemplates();
  }, [searchParams]);

  const toggleBranch = (branchId: string, checked: boolean) => {
    setFormData((prev) => {
      const set = new Set(prev.branchIds);
      if (checked) set.add(branchId);
      else set.delete(branchId);
      return { ...prev, branchIds: Array.from(set) };
    });
  };

  const loadTemplate = async (templateId: string) => {
    const template = templates.find((t) => t.TemplateId === templateId);
    if (template) {
      // Fetch template details including checklist items
      try {
        const response = await api.get(`/templates/${templateId}`);
        const templateDetails = response.data;

        setFormData({
          ...formData,
          title: template.Name,
          description: template.Description || "",
          scope: template.Scope,
          priority: template.Priority || "medium",
        });

        // Populate checklist items if they exist
        if (templateDetails.items && templateDetails.items.length > 0) {
          const items = templateDetails.items.map(
            (item: any, index: number) => ({
              id: index + 1,
              text: item.Title || item.text || "",
            })
          );
          setChecklistItems(items);
        }
      } catch (error) {
        console.error("Failed to load template details:", error);
        // Fallback to basic template data
        setFormData({
          ...formData,
          title: template.Name,
          description: template.Description || "",
          scope: template.Scope,
          priority: template.Priority || "medium",
        });
      }
    }
  };

  const saveAsTemplate = async () => {
    if (!templateName.trim()) return;

    try {
      const response = await api.post("/templates", {
        name: templateName,
        description: formData.description,
        category: templateCategory,
        priority: formData.priority,
        scope: formData.scope,
        items: checklistItems.filter((item) => item.text.trim() !== ""),
      });

      // Refresh templates
      const templatesResponse = await api.get("/templates");
      setTemplates(templatesResponse.data.items || []);
      setTemplateName("");
      setShowSaveTemplate(false);
    } catch (error) {
      console.error("Failed to save template:", error);
    }
  };

  const addChecklistItem = () => {
    const newId = Math.max(...checklistItems.map((item) => item.id), 0) + 1;
    setChecklistItems([...checklistItems, { id: newId, text: "" }]);
  };

  const removeChecklistItem = (id: number) => {
    if (checklistItems.length > 1) {
      setChecklistItems(checklistItems.filter((item) => item.id !== id));
    }
  };

  const updateChecklistItem = (id: number, text: string) => {
    setChecklistItems(
      checklistItems.map((item) => (item.id === id ? { ...item, text } : item))
    );
  };

  const handleAssigneeChange = (userId: string, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        assigneeIds: [...formData.assigneeIds, userId],
      });
    } else {
      setFormData({
        ...formData,
        assigneeIds: formData.assigneeIds.filter((id) => id !== userId),
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let deadline = formData.deadline;
      let startTime = null;
      let endTime = null;

      if (formData.scope === "daily" && formData.isRepeating) {
        // For daily repeating tasks, use today's date with start and end times
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time part

        // Set deadline to end time (task must be completed by this time)
        if (formData.endTime) {
          const [endHours, endMinutes] = formData.endTime
            .split(":")
            .map(Number);
          const deadlineDate = new Date(today);
          deadlineDate.setHours(endHours, endMinutes, 0, 0);
          deadline = deadlineDate.toISOString();
        }

        // Set start time
        if (formData.startTime) {
          const [startHours, startMinutes] = formData.startTime
            .split(":")
            .map(Number);
          const startDate = new Date(today);
          startDate.setHours(startHours, startMinutes, 0, 0);
          startTime = startDate.toISOString();
        }

        // Set end time
        if (formData.endTime) {
          const [endHours, endMinutes] = formData.endTime
            .split(":")
            .map(Number);
          const endDate = new Date(today);
          endDate.setHours(endHours, endMinutes, 0, 0);
          endTime = endDate.toISOString();
        }
      } else {
        // For non-daily or non-repeating tasks, handle deadline as before
        if (deadline && !deadline.includes("T")) {
          // If it's a date-only format, convert to datetime
          const dateObj = new Date(deadline);
          if (!isNaN(dateObj.getTime())) {
            // Ensure the date is not in the past
            const now = new Date();
            if (dateObj < now) {
              dateObj.setDate(now.getDate() + 1); // Move to tomorrow if date is in past
            }
            deadline = dateObj.toISOString();
          }
        } else if (
          deadline &&
          deadline.includes("T") &&
          !deadline.includes(":")
        ) {
          // Fix incomplete datetime strings like '2025-08-31T01:16' by adding seconds
          deadline = deadline + ":00";
        }
      }

      const taskData = {
        title: formData.title,
        description: formData.description,
        scope: formData.scope,
        deadline: deadline,
        startTime: startTime,
        endTime: endTime,
        branchIds: formData.branchIds,
        assigneeIds: formData.assigneeIds,
        priority: formData.priority,
        checklistItems: checklistItems.filter(
          (item) => item.text.trim() !== ""
        ),
        isRepeating: formData.isRepeating,
        repeatFrequency: formData.isRepeating ? formData.repeatFrequency : null,
        repeatCount: formData.isRepeating ? formData.repeatCount : null,
        repeatEndDate:
          formData.isRepeating && formData.repeatEndDate
            ? formData.repeatEndDate
            : null,
      };

      console.log("Sending task data:", taskData); // Debug log
      await api.post("/tasks", taskData);
      router.push("/tasks");
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  const isFormValid = () => {
    if (formData.scope === "daily" && formData.isRepeating) {
      // For daily repeating tasks, require start time and end time
      return (
        formData.title &&
        formData.title.trim() !== "" &&
        formData.scope &&
        formData.scope !== "" &&
        formData.startTime !== "" &&
        formData.endTime !== "" &&
        formData.branchIds &&
        formData.branchIds[0] !== "" &&
        formData.assigneeIds.length > 0 &&
        checklistItems.some((item) => item.text && item.text.trim() !== "")
      );
    } else {
      // For other tasks, require deadline
      const hasDeadline = formData.deadline && formData.deadline !== "";
      return (
        formData.title &&
        formData.title.trim() !== "" &&
        formData.scope &&
        formData.scope !== "" &&
        hasDeadline &&
        formData.branchIds &&
        formData.branchIds[0] !== "" &&
        formData.assigneeIds.length > 0 &&
        checklistItems.some((item) => item.text && item.text.trim() !== "")
      );
    }
  };

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
          <h1 className="text-3xl font-bold text-foreground">
            Create New Task
          </h1>
          <p className="text-muted-foreground">
            Set up a new task with checklist and assignments
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowSaveTemplate(true)}
            className="bg-transparent"
          >
            <Save className="h-4 w-4 mr-2" />
            Save as Template
          </Button>
          <Link href="/templates">
            <Button variant="outline" className="bg-transparent">
              <FileText className="h-4 w-4 mr-2" />
              Manage Templates
            </Button>
          </Link>
        </div>
      </div>

      {templates.length > 0 && (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Use Template</CardTitle>
            <CardDescription>
              Start with a pre-built template to save time
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 max-w-lg">
              <div className="flex-1">
                <Select
                  value={selectedTemplate}
                  onValueChange={setSelectedTemplate}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem
                        key={template.TemplateId}
                        value={template.TemplateId}
                      >
                        {template.Name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                onClick={() => loadTemplate(selectedTemplate)}
                disabled={!selectedTemplate || !selectedTemplate.trim()}
              >
                Load Template
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showSaveTemplate && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardHeader>
            <CardTitle>Save as Template</CardTitle>
            <CardDescription>
              Save this task configuration for future reuse
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="templateName">Template Name *</Label>
                <Input
                  id="templateName"
                  placeholder="Enter template name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="templateCategory">Category</Label>
                <Select
                  value={templateCategory}
                  onValueChange={setTemplateCategory}
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
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={saveAsTemplate}
                disabled={!templateName.trim()}
              >
                Save Template
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSaveTemplate(false)}
                className="bg-transparent"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 mb-20">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Enter the main details for your task
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Task Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter task title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) =>
                    setFormData({ ...formData, priority: value })
                  }
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

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what needs to be done (optional)"
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scope">Scope *</Label>
                <Select
                  value={formData.scope}
                  onValueChange={(value) =>
                    setFormData({ ...formData, scope: value })
                  }
                >
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

              {formData.scope === "daily" && formData.isRepeating ? (
                <div className="grid grid-cols-1 gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startTime">Start Time *</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={formData.startTime}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            startTime: e.target.value,
                          })
                        }
                        className="text-sm"
                        required
                        placeholder="HH:MM"
                      />
                      <p className="text-xs text-muted-foreground">
                        Task becomes available at this time each day
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endTime">End Time *</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={formData.endTime}
                        onChange={(e) =>
                          setFormData({ ...formData, endTime: e.target.value })
                        }
                        className="text-sm"
                        required
                        placeholder="HH:MM"
                      />
                      <p className="text-xs text-muted-foreground">
                        Task must be completed by this time each day
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline *</Label>
                  <Input
                    id="deadline"
                    type="datetime-local"
                    value={formData.deadline}
                    onChange={(e) =>
                      setFormData({ ...formData, deadline: e.target.value })
                    }
                    className="text-sm"
                    required
                  />
                </div>
              )}

              {/* Branch Selection - Role-based UI */}
              {/* Branch managers don't see branch selection - auto-assigned to their branch */}
              {currentUser?.role === "branch_manager" ? (
                <div className="space-y-2">
                  <Label htmlFor="branchId">Branch</Label>
                  <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
                    <span className="font-medium">
                      {formData.branchIds
                        ? branches.find(
                            (b) => b.BranchId === formData.branchIds
                          )?.BranchName || "Loading..."
                        : "Your Assigned Branch"}
                    </span>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Your Branch
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Tasks are automatically assigned to your branch
                  </p>
                </div>
              ) : currentUser?.role === "staff" && branches.length === 1 ? (
                <div className="space-y-2">
                  <Label htmlFor="branchId">Branch</Label>
                  <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
                    <span className="font-medium">
                      {branches[0].BranchName}
                    </span>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Assigned Branch
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="branchId">
                    Branch *
                    {currentUser?.role === "area_manager" && (
                      <span className="text-xs text-muted-foreground ml-1">
                        ({branches.length} branches assigned)
                      </span>
                    )}
                    {currentUser?.role === "auditor" && (
                      <span className="text-xs text-muted-foreground ml-1">
                        ({branches.length} branches under audit)
                      </span>
                    )}
                  </Label>
                  {/* <Select
                    value={formData.branchIds[0] || ""}
                    onValueChange={(value) =>
                      setFormData({ ...formData, branchId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          currentUser?.role === "area_manager"
                            ? "Select branch to assign task"
                            : currentUser?.role === "auditor"
                            ? "Select branch to audit"
                            : "Select branch"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch: any) => (
                        <SelectItem
                          key={branch.BranchId}
                          value={branch.BranchId}
                        >
                          <div className="flex items-center gap-2">
                            {branch.BranchName}
                            {currentUser?.role === "area_manager" && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                                Managed
                              </span>
                            )}
                            {currentUser?.role === "auditor" && (
                              <span className="text-xs bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">
                                Audit
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select> */}

                  <div className="border rounded-md p-2 max-h-56 overflow-y-auto">
                    {branches.map((branch: any) => (
                      <label
                        key={branch.BranchId}
                        className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded"
                      >
                        <Checkbox
                          checked={formData.branchIds.includes(branch.BranchId)}
                          onCheckedChange={(checked) => {
                            const set = new Set(formData.branchIds);
                            if (checked) set.add(branch.BranchId);
                            else set.delete(branch.BranchId);
                            setFormData({
                              ...formData,
                              branchIds: Array.from(set),
                            });
                          }}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{branch.BranchName}</div>
                          <div className="text-xs text-muted-foreground">
                            {branch.LocationCode}
                          </div>
                        </div>
                        {currentUser?.role === "area_manager" && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                            Managed
                          </span>
                        )}
                        {currentUser?.role === "auditor" && (
                          <span className="text-xs bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">
                            Audit
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Select one or more branches for this task
                  </p>

                  {/* Show helpful text based on role */}
                  {currentUser?.role === "area_manager" && (
                    <p className="text-xs text-muted-foreground">
                      Select which branch this task should be assigned to
                    </p>
                  )}
                  {currentUser?.role === "auditor" && (
                    <p className="text-xs text-muted-foreground">
                      Select branch to create audit task for
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Repeating Task Configuration */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Task Repetition</CardTitle>
              <CardDescription className="text-sm">
                Configure this task to automatically repeat at regular intervals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                <div className="space-y-1">
                  <Label htmlFor="isRepeating" className="text-sm font-medium">
                    Enable Repeating Task
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically create new instances of this task
                  </p>
                </div>
                <Switch
                  id="isRepeating"
                  checked={formData.isRepeating}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isRepeating: checked })
                  }
                  className="data-[state=unchecked]:bg-gray-300"
                />
              </div>

              {formData.isRepeating && (
                <div className="space-y-6 pt-2">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-2">
                      <Label
                        htmlFor="repeatFrequency"
                        className="text-sm font-medium"
                      >
                        Repeat Frequency
                      </Label>
                      <Select
                        value={formData.repeatFrequency}
                        onValueChange={(value) =>
                          setFormData({ ...formData, repeatFrequency: value })
                        }
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label
                          htmlFor="repeatCount"
                          className="text-sm font-medium"
                        >
                          No. of Repetitions
                        </Label>
                        <Input
                          id="repeatCount"
                          type="number"
                          min="1"
                          max="365"
                          value={formData.repeatCount}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              repeatCount: parseInt(e.target.value) || 1,
                            })
                          }
                          placeholder="30"
                          className="h-9"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="repeatEndDate"
                          className="text-sm font-medium"
                        >
                          End Date (Optional)
                        </Label>
                        <Input
                          id="repeatEndDate"
                          type="date"
                          value={formData.repeatEndDate}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              repeatEndDate: e.target.value,
                            })
                          }
                          className="h-9"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="text-sm space-y-2">
                        <p className="font-medium text-blue-900">
                          How it works:
                        </p>
                        <ul className="text-blue-800 space-y-1 text-xs">
                          {formData.scope === "daily" ? (
                            <>
                              <li>
                                • Tasks become available immediately when
                                created
                              </li>
                              <li>
                                • Must be completed by the specified time each
                                day
                              </li>
                              <li>
                                • New task automatically created for the next
                                day when completed
                              </li>
                              <li>
                                • Each task has the same assignees and checklist
                              </li>
                              <li>
                                • No "remaining days" - fresh daily completion
                                cycle
                              </li>
                            </>
                          ) : (
                            <>
                              <li>
                                • New task instances created automatically based
                                on frequency
                              </li>
                              <li>
                                • Each task has the same assignees and checklist
                              </li>
                              <li>
                                • Deadlines adjusted based on repeat frequency
                              </li>
                              <li>
                                • Tasks stop when end date reached or repeat
                                count met
                              </li>
                            </>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Checklist Builder */}
          <Card>
            <CardHeader>
              <CardTitle>Checklist Builder</CardTitle>
              <CardDescription>
                Create a checklist of items that need to be completed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {checklistItems.map((item, index) => (
                <div key={item.id} className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                  <div className="flex-1">
                    <Input
                      placeholder={`Checklist item ${index + 1}`}
                      value={item.text}
                      onChange={(e) =>
                        updateChecklistItem(item.id, e.target.value)
                      }
                      className="h-9"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeChecklistItem(item.id)}
                    disabled={checklistItems.length === 1}
                    className="h-9 w-9 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addChecklistItem}
                className="bg-transparent px-4 py-2 w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Checklist Item
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Assign Task</CardTitle>
            <CardDescription>
              {currentUser?.role === "branch_manager" ? (
                <p>
                  Select staff members from your branch to complete this task
                </p>
              ) : currentUser?.role === "area_manager" ? (
                <p>Select users from branches you manage</p>
              ) : currentUser?.role === "auditor" ? (
                <p>
                  Select users to audit from branches under your supervision
                </p>
              ) : (
                <p>Select who will be responsible for completing this task</p>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* User Selection */}
            <div className="max-h-80 overflow-y-auto space-y-2">
              {loadingBranchUsers ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mb-2"></div>
                  <p>Loading users for selected branch...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No users found matching your search</p>
                  {currentUser?.role === "branch_manager" && (
                    <div className="mt-2">
                      <p className="text-sm">
                        You can only assign tasks to staff members in your
                        branch
                      </p>
                      <p className="text-xs mt-1">
                        No staff members are currently assigned to your branch
                      </p>
                    </div>
                  )}
                  {currentUser?.role === "area_manager" &&
                    formData.branchIds && (
                      <p className="text-sm mt-2">
                        No eligible users found in this branch
                      </p>
                    )}
                  {currentUser?.role !== "branch_manager" &&
                    !formData.branchIds && (
                      <p className="text-sm mt-2">
                        Please select a branch first
                      </p>
                    )}
                </div>
              ) : (
                filteredUsers.map((user: any, index: number) => {
                  const userId = user.id || user.UserId;
                  const userEmail = user.email || user.Email;
                  const isCurrentUser = userId === currentUser?.id;
                  const canAssign = !isCurrentUser; // Don't allow self-assignment

                  // Create a unique key using userId and index to handle duplicates
                  const uniqueKey = `${userId}-${userEmail}-${index}`;

                  return (
                    <div
                      key={uniqueKey}
                      className={`flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 ${
                        !canAssign ? "opacity-50" : ""
                      }`}
                    >
                      <Checkbox
                        id={userId}
                        checked={
                          canAssign && formData.assigneeIds.includes(userId)
                        }
                        onCheckedChange={(checked) =>
                          canAssign &&
                          handleAssigneeChange(userId, checked as boolean)
                        }
                        disabled={!canAssign}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Label
                            htmlFor={userId}
                            className={`font-medium ${
                              canAssign
                                ? "cursor-pointer"
                                : "cursor-not-allowed"
                            }`}
                          >
                            {user.name || user.FullName}
                          </Label>
                          {isCurrentUser && (
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                              You
                            </span>
                          )}
                          {formData.branchIds && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              In Branch
                            </span>
                          )}
                          {user.RoleName && (
                            <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                              {user.RoleName}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {user.email || user.Email}
                          {!canAssign && (
                            <span className="text-red-500 ml-2">
                              Cannot assign to yourself
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {formData.assigneeIds.length === 0 && (
              <p className="text-sm text-red-600">
                Please select at least one assignee
              </p>
            )}

            {formData.assigneeIds.length > 0 && (
              <div className="text-sm text-muted-foreground">
                {formData.assigneeIds.length} user
                {formData.assigneeIds.length > 1 ? "s" : ""} selected
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 pb-16 mb-16 justify-center">
          <Link href="/tasks">
            <Button
              type="button"
              variant="outline"
              className="bg-transparent px-6"
            >
              Cancel
            </Button>
          </Link>
          <Button type="submit" className="px-6" disabled={!isFormValid()}>
            Save & Assign Task
          </Button>
        </div>
      </form>
    </div>
  );
}
