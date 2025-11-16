"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import {
  fetchBranches,
  createBranch,
  updateBranch,
  deleteBranch,
  assignUsersToBranch,
} from "@/redux/modules/branches/actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Building,
  MapPin,
  Users,
  TrendingUp,
  X,
} from "lucide-react";
import { api } from "@/lib/axios";
import { showError, showSuccess, showWarning } from "@/lib/toast";

interface Branch {
  BranchId: string;
  BranchName: string;
  LocationCode: string;
  GroupName: string;
  IsActive: boolean;
  CreatedAt: string;
  latitude?: string; // <-- ADD THIS
  longitude?: string; // <-- ADD THIS
}

interface User {
  UserId: string;
  Email: string;
  FullName: string;
  Phone: string;
  IsActive: boolean;
  RoleName: string;
  RoleRank: number;
  PositionName: string;
  BranchCount?: number;
  AssignedBranches?: string;
  SupervisedAreaManagers?: string;
  SupervisedAreaManagerIds?: string;
  AssignmentType?: string;
}

interface BranchUser {
  UserId: string;
  Email: string;
  FullName: string;
  Phone: string;
  IsActive: boolean;
  RoleName: string;
  RoleRank: number;
  PositionName: string;
}

export function BranchesManagement() {
  const dispatch = useDispatch();
  const {
    items: branches,
    loading,
    error,
  } = useSelector((state: RootState) => state.branches);

  useEffect(() => {
    dispatch(fetchBranches() as any);
  }, [dispatch]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isManagerDialogOpen, setIsManagerDialogOpen] = useState(false);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isStaffDialogOpen, setIsStaffDialogOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [selectedStaffForRemoval, setSelectedStaffForRemoval] = useState<
    string[]
  >([]);
  const [isRemovalMode, setIsRemovalMode] = useState(false);
  const [isAreaManagerDialogOpen, setIsAreaManagerDialogOpen] = useState(false);
  const [isAuditorDialogOpen, setIsAuditorDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [branchUsers, setBranchUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedManagerId, setSelectedManagerId] = useState<string>("");
  const [areaManagers, setAreaManagers] = useState<User[]>([]);
  const [auditors, setAuditors] = useState<User[]>([]);
  const [selectedAreaManagerId, setSelectedAreaManagerId] =
    useState<string>("");
  const [selectedAuditorId, setSelectedAuditorId] = useState<string>("");
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
  const [selectedAreaManagerIds, setSelectedAreaManagerIds] = useState<
    string[]
  >([]);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false); // <-- ADD THIS
  const [formData, setFormData] = useState({
    BranchName: "",
    LocationCode: "",
    GroupName: "",
    IsActive: true,
    latitude: "", // <-- ADD THIS
    longitude: "", // <-- ADD THIS
    radius_meters: "100",
  });

  const filteredBranches = branches.filter((branch: any) => {
    const matchesSearch =
      branch.BranchName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.GroupName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && branch.IsActive) ||
      (statusFilter === "inactive" && !branch.IsActive);

    return matchesSearch && matchesStatus;
  });

  // Fetch users in a branch using direct API call for better performance
  const fetchUsersInBranch = async (branchId: string) => {
    try {
      const response = await api.get(`/branches/${branchId}/users`);
      setBranchUsers(response.data.items || []);
    } catch (error) {
      console.error("Failed to fetch users in branch:", error);
    }
  };

  // Fetch all users
  const fetchAllUsers = async () => {
    try {
      const response = await api.get("/users");
      setAllUsers(response.data.items || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  // Handle view users in branch
  const handleViewUsers = async (branch: Branch) => {
    setSelectedBranch(branch);
    setSelectedStaffForRemoval([]); // Reset selections
    setIsRemovalMode(false); // Reset removal mode
    await fetchUsersInBranch(branch.BranchId);
    setIsUserDialogOpen(true);
  };

  // Fetch users by role
  const fetchUsersByRole = async (role: string) => {
    try {
      const response = await api.get(`/branches/users-by-role?role=${role}`);
      return response.data.items || [];
    } catch (error) {
      console.error(`Failed to fetch users by role ${role}:`, error);
      return [];
    }
  };

  // Fetch branch managers for assignment
  const fetchBranchManagers = async () => {
    try {
      const response = await api.get(
        "/branches/users-by-role?role=branch_manager"
      );
      setAllUsers(response.data.items || []);
    } catch (error) {
      console.error("Failed to fetch branch managers:", error);
    }
  };

  // Fetch staff for assignment
  const fetchStaff = async () => {
    try {
      const response = await api.get("/branches/users-by-role?role=staff");
      setAllUsers(response.data.items || []);
    } catch (error) {
      console.error("Failed to fetch staff:", error);
    }
  };

  // Handle assign branch manager
  const handleAssignBranchManager = async (branch: Branch, userId: string) => {
    try {
      // Check if the selected manager is already assigned to another branch
      const selectedManager = allUsers.find((user) => user.UserId === userId);
      const isAlreadyAssigned =
        selectedManager &&
        selectedManager.AssignedBranches &&
        selectedManager.AssignedBranches.trim() !== "";

      if (isAlreadyAssigned) {
        const confirmReassign = confirm(
          `${selectedManager.FullName} is currently assigned to: ${selectedManager.AssignedBranches}\n\n` +
            `Assigning them to ${branch.BranchName} will remove them from their current branch(es).\n\n` +
            `Do you want to continue?`
        );
        if (!confirmReassign) {
          return;
        }
      }

      await api.post(`/branches/${branch.BranchId}/assign-branch-manager`, {
        userId,
      });

      const message =
        userId && userId.trim() !== ""
          ? `Branch manager assigned to ${branch.BranchName} successfully`
          : `Branch manager unassigned from ${branch.BranchName} successfully`;

      showSuccess(message);
      // Refresh data in parallel for better performance
      await Promise.all([
        fetchUsersInBranch(branch.BranchId),
        fetchBranchManagers(),
      ]);
    } catch (error) {
      console.error("Failed to assign branch manager:", error);
      showError("Failed to assign branch manager");
    }
  };

  // Handle assign staff
  // const handleAssignStaff = async (branch: Branch, userId: string) => {
  //   try {
  //     // Check if the selected staff is already assigned to another branch
  //     const selectedStaff = allUsers.find(user => user.UserId === userId)
  //     const isAlreadyAssigned = selectedStaff && selectedStaff.AssignedBranches && selectedStaff.AssignedBranches.trim() !== ''

  //     if (isAlreadyAssigned) {
  //       const confirmReassign = confirm(
  //         `${selectedStaff.FullName} is currently assigned to: ${selectedStaff.AssignedBranches}\n\n` +
  //         `Assigning them to ${branch.BranchName} will remove them from their current branch.\n\n` +
  //         `Do you want to continue?`
  //       )
  //       if (!confirmReassign) {
  //         return
  //       }
  //     }

  //     await api.post(`/branches/${branch.BranchId}/assign-staff`, { userId })

  //     const message = userId && userId.trim() !== ''
  //       ? `Staff assigned to ${branch.BranchName} successfully`
  //       : `Staff unassigned from ${branch.BranchName} successfully`

  //     showSuccess(message)
  //     // Refresh data in parallel for better performance
  //     await Promise.all([
  //       fetchUsersInBranch(branch.BranchId),
  //       fetchStaff()
  //     ])
  //   } catch (error) {
  //     console.error('Failed to assign staff:', error)
  //     showError('Failed to assign staff')
  //   }
  // }
  const handleAssignStaff = async (branch: Branch, userId: string) => {
    try {
      // The confirmation dialog and logic to check for other branches has been removed.
      // We no longer need to warn the user because we are ADDING them, not REPLACING them.

      // 1. Get the current list of all users assigned to this branch.
      // This is crucial to avoid removing other staff members who are already there.
      const response = await api.get(`/branches/${branch.BranchId}/users`);
      const existingUserIds = response.data.items.map(
        (user: any) => user.UserId
      );

      // 2. Create the new, updated list of user IDs for this branch.
      // We add the newly selected staff member's ID to the existing list.
      // Using a Set prevents duplicates if the user is somehow already in the list.
      const updatedUserIds = [...new Set([...existingUserIds, userId])];

      // 3. Call the correct, flexible endpoint with the complete array of user IDs.
      await api.post(`/branches/${branch.BranchId}/assign-users`, {
        userIds: updatedUserIds,
      });

      // 4. Show a success message and refresh the data.
      const message = `Staff assigned to ${branch.BranchName} successfully`;
      showSuccess(message);

      // Refresh data to show the updated assignment.
      await Promise.all([
        fetchUsersInBranch(branch.BranchId),
        fetchStaff(), // Assuming this refreshes the list of available staff
      ]);
    } catch (error) {
      console.error("Failed to assign staff:", error);
      showError("Failed to assign staff");
    }
  };

  // Handle remove specific staff from branch
  const handleRemoveStaffFromBranch = async (
    userId: string,
    branch: Branch
  ) => {
    try {
      // To remove a specific staff, we need to call the assign-staff endpoint with empty userId
      // but we need to modify the backend to handle specific user removal
      await api.delete(`/branches/${branch.BranchId}/users/${userId}`);

      showSuccess(`Staff removed from ${branch.BranchName} successfully`);
      // Refresh the branch users
      await fetchUsersInBranch(branch.BranchId);
    } catch (error) {
      console.error("Failed to remove staff:", error);
      showError("Failed to remove staff");
    }
  };

  // Handle staff selection for bulk removal
  const handleStaffSelectionForRemoval = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedStaffForRemoval([...selectedStaffForRemoval, userId]);
    } else {
      setSelectedStaffForRemoval(
        selectedStaffForRemoval.filter((id) => id !== userId)
      );
    }
  };

  // Handle bulk removal of selected users
  const handleBulkRemoveUsers = async (branch: Branch) => {
    if (selectedStaffForRemoval.length === 0) {
      showWarning("Please select staff members to remove");
      return;
    }

    const confirmRemove = confirm(
      `Remove ${selectedStaffForRemoval.length} staff member(s) from ${branch.BranchName}?\n\n` +
        `This action cannot be undone.`
    );

    if (!confirmRemove) return;

    let successCount = 0;
    let failedCount = 0;
    const failedUsers: string[] = [];

    try {
      // Remove each selected staff member individually to track success/failure
      for (const userId of selectedStaffForRemoval) {
        try {
          await api.delete(`/branches/${branch.BranchId}/users/${userId}`);
          successCount++;
        } catch (error) {
          console.error(`Failed to remove staff ${userId}:`, error);
          failedCount++;
          failedUsers.push(userId);
        }
      }

      // Show appropriate message based on results
      if (successCount > 0 && failedCount === 0) {
        showSuccess(
          `${successCount} staff member(s) removed from ${branch.BranchName} successfully`
        );
      } else if (successCount > 0 && failedCount > 0) {
        showWarning(
          `${successCount} staff member(s) removed successfully, but ${failedCount} failed to remove.`
        );
      } else {
        showError("Failed to remove any staff members. Please try again.");
        return; // Don't clear selections if nothing was removed
      }

      // Clear selections and refresh only if at least one removal was successful
      setSelectedStaffForRemoval([]);
      await fetchUsersInBranch(branch.BranchId);
    } catch (error) {
      console.error("Error in bulk removal process:", error);
      showError(
        "An error occurred during the removal process. Please check the console for details."
      );
    }
  };

  // Handle assign area manager
  const handleAssignAreaManager = async (
    userId: string,
    branchIds: string[]
  ) => {
    try {
      await api.post("/branches/assign-area-manager", { userId, branchIds });
      showSuccess("Area manager assigned successfully");
      setIsAreaManagerDialogOpen(false);
      setSelectedAreaManagerId("");
      setSelectedBranchIds([]);
      // Refresh branches
      dispatch(fetchBranches() as any);
    } catch (error) {
      console.error("Failed to assign area manager:", error);
      showError("Failed to assign area manager");
    }
  };

  // Handle assign auditor to area managers
  const handleAssignAuditorToAreaManagers = async (
    auditorId: string,
    areaManagerIds: string[]
  ) => {
    try {
      await api.post("/branches/assign-auditor-to-area-managers", {
        auditorId,
        areaManagerIds,
      });
      showSuccess("Auditor assigned to area managers successfully");
      setIsAuditorDialogOpen(false);
      setSelectedAuditorId("");
      setSelectedAreaManagerIds([]);
      // Refresh data
      dispatch(fetchBranches() as any);
    } catch (error) {
      console.error("Failed to assign auditor to area managers:", error);
      showError("Failed to assign auditor to area managers");
    }
  };

  // Handle open area manager dialog
  const handleOpenAreaManagerDialog = async () => {
    const managers = await fetchUsersByRole("area_manager");
    setAreaManagers(managers);
    setIsAreaManagerDialogOpen(true);
    // Reset selections
    setSelectedAreaManagerId("");
    setSelectedBranchIds([]);
  };

  // Handle area manager selection change
  const handleAreaManagerSelectionChange = (managerId: string) => {
    setSelectedAreaManagerId(managerId);

    // Find the selected manager and pre-select their current branches
    const selectedManager = areaManagers.find(
      (manager) => manager.UserId === managerId
    );
    if (selectedManager && selectedManager.AssignedBranches) {
      // Parse the assigned branches and find their IDs
      const assignedBranchNames = selectedManager.AssignedBranches.split(", ");
      const assignedBranchIds = branches
        .filter((branch: any) =>
          assignedBranchNames.includes(branch.BranchName)
        )
        .map((branch: any) => branch.BranchId);
      setSelectedBranchIds(assignedBranchIds);
    } else {
      setSelectedBranchIds([]);
    }
  };

  // Handle open auditor dialog
  const handleOpenAuditorDialog = async () => {
    const auditorUsers = await fetchUsersByRole("auditor");
    const areaManagerUsers = await fetchUsersByRole("area_manager");
    setAuditors(auditorUsers);
    setAreaManagers(areaManagerUsers);
    setIsAuditorDialogOpen(true);
    // Reset selections
    setSelectedAuditorId("");
    setSelectedAreaManagerIds([]);
  };

  // Handle auditor selection change
  const handleAuditorSelectionChange = (auditorId: string) => {
    setSelectedAuditorId(auditorId);

    // Find the selected auditor and pre-select their currently supervised area managers
    const selectedAuditor = auditors.find(
      (auditor) => auditor.UserId === auditorId
    );
    if (selectedAuditor && selectedAuditor.SupervisedAreaManagerIds) {
      // Parse the supervised area manager IDs
      const supervisedIds = selectedAuditor.SupervisedAreaManagerIds.split(
        ","
      ).filter((id) => id.trim());
      setSelectedAreaManagerIds(supervisedIds);
    } else {
      setSelectedAreaManagerIds([]);
    }
  };

  // Handle area manager selection for auditor assignment
  const handleAreaManagerSelectionForAuditor = (
    managerId: string,
    checked: boolean
  ) => {
    if (checked) {
      setSelectedAreaManagerIds([...selectedAreaManagerIds, managerId]);
    } else {
      setSelectedAreaManagerIds(
        selectedAreaManagerIds.filter((id) => id !== managerId)
      );
    }
  };

  // Handle branch selection for multi-branch assignments
  const handleBranchSelectionChange = (branchId: string, checked: boolean) => {
    if (checked) {
      setSelectedBranchIds([...selectedBranchIds, branchId]);
    } else {
      setSelectedBranchIds(selectedBranchIds.filter((id) => id !== branchId));
    }
  };

  const handleFetchLocation = () => {
    if (!navigator.geolocation) {
      showError("Geolocation is not supported by your browser.");
      return;
    }

    setIsFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString(),
        }));
        setIsFetchingLocation(false);
        showSuccess("Location fetched successfully!");
      },
      (error) => {
        showError(`Failed to get location: ${error.message}`);
        setIsFetchingLocation(false);
      }
    );
  };
  const handleCreateBranch = () => {
    setEditingBranch(null);
    setFormData({
      BranchName: "",
      LocationCode: "",
      GroupName: "",
      IsActive: true,
      latitude: "", // <-- ADD THIS
      longitude: "", // <-- ADD THIS
      radius_meters: "100",
    });
    setIsDialogOpen(true);
  };

  const handleEditBranch = (branch: any) => {
    setEditingBranch(branch);
    setFormData({
      BranchName: branch.BranchName,
      LocationCode: branch.LocationCode || "",
      GroupName: branch.GroupName || "",
      IsActive: branch.IsActive,
      latitude: branch.latitude || "", // <-- ADD THIS
      longitude: branch.longitude || "", // <-- ADD THIS
      radius_meters: branch.radius_meters?.toString() || "100",
    });
    setIsDialogOpen(true);
  };

  const handleDeleteBranch = async (branchId: string) => {
    if (confirm("Are you sure you want to delete this branch?")) {
      try {
        await dispatch(deleteBranch(branchId) as any);
        showSuccess("Branch deleted successfully!");
        // Refresh the branches list after deleting a branch
        dispatch(fetchBranches() as any);
      } catch (error) {
        console.error("Failed to delete branch:", error);
        showError("Failed to delete branch. Please try again.");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingBranch) {
        // Update existing branch
        await dispatch(updateBranch(editingBranch.BranchId, formData) as any);
        showSuccess(`Branch "${formData.BranchName}" updated successfully!`);
        // Refresh the branches list after updating a branch
        dispatch(fetchBranches() as any);
        setIsDialogOpen(false);
      } else {
        // Create new branch
        await dispatch(createBranch(formData) as any);
        showSuccess(`Branch "${formData.BranchName}" created successfully!`);
        // Refresh the branches list after creating a new branch
        dispatch(fetchBranches() as any);
        setIsDialogOpen(false);
      }
    } catch (error: any) {
      console.error("Failed to save branch:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to save branch. Please try again.";
      showError(errorMessage);
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? "default" : "secondary";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">Loading...</div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64 text-red-600">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Branches Management
          </h1>
          <p className="text-muted-foreground">
            Manage pharmacy branch locations and details
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCreateBranch}>
            <Plus className="h-4 w-4 mr-2" />
            Add Branch
          </Button>
          <Button variant="outline" onClick={handleOpenAreaManagerDialog}>
            <Users className="h-4 w-4 mr-2" />
            Assign Area Manager
          </Button>
          <Button variant="outline" onClick={handleOpenAuditorDialog}>
            <Users className="h-4 w-4 mr-2" />
            Assign Auditor to Area Managers
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Branches
            </CardTitle>
            <Building className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {branches.length}
            </div>
            <p className="text-xs text-muted-foreground">Pharmacy locations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Branches
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {branches.filter((b: any) => b.IsActive).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently operational
            </p>
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
                placeholder="Search branches..."
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

      {/* Branches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBranches.map((branch: any) => (
          <Card
            key={branch.BranchId}
            className="hover:shadow-md transition-shadow"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{branch.BranchName}</CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" />
                    {branch.GroupName}
                  </CardDescription>
                </div>
                <Badge
                  variant={getStatusColor(branch.IsActive)}
                  className="text-xs"
                >
                  {branch.IsActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  Location Code: {branch.LocationCode || "N/A"}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditBranch(branch)}
                    className="flex-1 bg-transparent"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteBranch(branch.BranchId)}
                    className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewUsers(branch)}
                    className="flex-1 bg-transparent"
                  >
                    <Users className="h-3 w-3 mr-1" />
                    View
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedBranch(branch);
                      // Fetch all staff for assignment
                      fetchStaff().then(() => {
                        setIsStaffDialogOpen(true);
                      });
                    }}
                    className="flex-1 bg-transparent"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Assign Staff
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedBranch(branch);
                      // Fetch all branch managers for assignment
                      fetchBranchManagers().then(() => {
                        setIsManagerDialogOpen(true);
                      });
                    }}
                    className="flex-1 bg-transparent"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Assign Manager
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Branch Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingBranch ? "Edit Branch" : "Create New Branch"}
            </DialogTitle>
            <DialogDescription>
              {editingBranch
                ? "Update branch information and details."
                : "Add a new pharmacy branch location."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="BranchName">Branch Name *</Label>
              <Input
                id="BranchName"
                value={formData.BranchName}
                onChange={(e) =>
                  setFormData({ ...formData, BranchName: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="LocationCode">Location Code</Label>
              <Input
                id="LocationCode"
                value={formData.LocationCode}
                onChange={(e) =>
                  setFormData({ ...formData, LocationCode: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="GroupName">Group Name *</Label>
              <Input
                id="GroupName"
                value={formData.GroupName}
                onChange={(e) =>
                  setFormData({ ...formData, GroupName: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Branch Location</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleFetchLocation}
                  disabled={isFetchingLocation}
                >
                  <MapPin className="h-3 w-3 mr-1" />
                  {isFetchingLocation ? "Getting..." : "Get Current Location"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Click the button to auto-fill location if you are at the branch.
              </p>
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    placeholder="e.g. 13.0827"
                    value={formData.latitude}
                    onChange={(e) =>
                      setFormData({ ...formData, latitude: e.target.value })
                    }
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    placeholder="e.g. 80.2707"
                    value={formData.longitude}
                    onChange={(e) =>
                      setFormData({ ...formData, longitude: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="radius_meters">
                    Geofence Radius (in meters)
                  </Label>
                  <Input
                    id="radius_meters"
                    type="number"
                    placeholder="e.g. 100"
                    value={formData.radius_meters}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        radius_meters: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="IsActive">Status</Label>
              <Select
                value={formData.IsActive ? "active" : "inactive"}
                onValueChange={(value) =>
                  setFormData({ ...formData, IsActive: value === "active" })
                }
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
                {editingBranch ? "Update Branch" : "Create Branch"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Branch Manager Assignment Dialog */}
      <Dialog open={isManagerDialogOpen} onOpenChange={setIsManagerDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedBranch
                ? `Assign Manager to ${selectedBranch.BranchName}`
                : "Assign Branch Manager"}
            </DialogTitle>
            <DialogDescription>
              Select a user to assign as branch manager
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="max-h-96 overflow-y-auto">
              {allUsers.length > 0 ? (
                <div className="space-y-2">
                  {allUsers.map((user) => (
                    <div
                      key={user.UserId}
                      className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <input
                        type="radio"
                        name="branchManager"
                        value={user.UserId}
                        checked={selectedManagerId === user.UserId}
                        onChange={(e) => setSelectedManagerId(e.target.value)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{user.FullName}</span>
                          <Badge variant="secondary" className="text-xs">
                            {user.RoleName}
                          </Badge>
                          {user.AssignedBranches && (
                            <Badge variant="outline" className="text-xs">
                              {user.BranchCount} branch
                              {user.BranchCount !== 1 ? "es" : ""}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {user.Email}
                          {user.AssignedBranches && (
                            <div className="text-xs text-blue-600 mt-1">
                              Currently: {user.AssignedBranches}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No branch managers available</p>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsManagerDialogOpen(false);
                  setSelectedManagerId("");
                }}
                className="flex-1 bg-transparent"
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1"
                onClick={() => {
                  if (selectedBranch) {
                    if (!selectedManagerId) {
                      // Unassign manager - show confirmation
                      const confirmUnassign = confirm(
                        `Are you sure you want to unassign the branch manager from ${selectedBranch.BranchName}?`
                      );
                      if (!confirmUnassign) {
                        return;
                      }
                    }
                    handleAssignBranchManager(
                      selectedBranch,
                      selectedManagerId || ""
                    );
                    setIsManagerDialogOpen(false);
                    setSelectedManagerId("");
                  }
                }}
              >
                {selectedManagerId ? "Assign Manager" : "Unassign Manager"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Staff Assignment Dialog */}
      <Dialog open={isStaffDialogOpen} onOpenChange={setIsStaffDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedBranch
                ? `Assign Staff to ${selectedBranch.BranchName}`
                : "Assign Staff"}
            </DialogTitle>
            <DialogDescription>
              Select a staff member to assign to this branch
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="max-h-96 overflow-y-auto">
              {allUsers.length > 0 ? (
                <div className="space-y-2">
                  {allUsers.map((user) => (
                    <div
                      key={user.UserId}
                      className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <input
                        type="radio"
                        name="staff"
                        value={user.UserId}
                        checked={selectedStaffId === user.UserId}
                        onChange={(e) => setSelectedStaffId(e.target.value)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{user.FullName}</span>
                          <Badge variant="secondary" className="text-xs">
                            {user.RoleName}
                          </Badge>
                          {user.AssignedBranches && (
                            <Badge variant="outline" className="text-xs">
                              {user.BranchCount} branch
                              {user.BranchCount !== 1 ? "es" : ""}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {user.Email}
                          {user.AssignedBranches && (
                            <div className="text-xs text-blue-600 mt-1">
                              Currently: {user.AssignedBranches}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No staff available</p>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsStaffDialogOpen(false);
                  setSelectedStaffId("");
                }}
                className="flex-1 bg-transparent"
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1"
                onClick={() => {
                  if (selectedBranch) {
                    if (!selectedStaffId) {
                      // Unassign all staff - show confirmation
                      const confirmUnassignAll = confirm(
                        `Are you sure you want to unassign ALL staff from ${selectedBranch.BranchName}?\n\n` +
                          `This will remove all staff members currently assigned to this branch.`
                      );
                      if (!confirmUnassignAll) {
                        return;
                      }
                    }
                    handleAssignStaff(selectedBranch, selectedStaffId || "");
                    setIsStaffDialogOpen(false);
                    setSelectedStaffId("");
                  }
                }}
              >
                {selectedStaffId ? "Assign Staff" : "Unassign All Staff"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* User View Dialog */}
      <Dialog
        open={isUserDialogOpen}
        onOpenChange={(open) => {
          setIsUserDialogOpen(open);
          if (!open) {
            setSelectedStaffForRemoval([]); // Reset selections when dialog closes
            setIsRemovalMode(false); // Reset removal mode when dialog closes
          }
        }}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {selectedBranch
                ? `Users in ${selectedBranch.BranchName}`
                : "Branch Users"}
            </DialogTitle>
            <DialogDescription>
              {selectedBranch
                ? `Manage users assigned to ${selectedBranch.BranchName}`
                : "Manage branch users"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Header with buttons */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Current Users</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsUserDialogOpen(false);
                    // Open staff assignment dialog
                    fetchStaff().then(() => {
                      setIsStaffDialogOpen(true);
                    });
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Staff
                </Button>
                {!isRemovalMode ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsRemovalMode(true)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove Users
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsRemovalMode(false);
                        setSelectedStaffForRemoval([]);
                      }}
                    >
                      Cancel
                    </Button>
                    {selectedStaffForRemoval.length > 0 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          selectedBranch &&
                          handleBulkRemoveUsers(selectedBranch)
                        }
                      >
                        <X className="h-4 w-4 mr-2" />
                        Remove Selected ({selectedStaffForRemoval.length})
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {branchUsers.length > 0 ? (
                <div className="space-y-2">
                  {branchUsers.map((user) => (
                    <div
                      key={user.UserId}
                      className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50"
                    >
                      {/* Checkbox for all users when in removal mode */}
                      {isRemovalMode && (
                        <input
                          type="checkbox"
                          checked={selectedStaffForRemoval.includes(
                            user.UserId
                          )}
                          onChange={(e) =>
                            handleStaffSelectionForRemoval(
                              user.UserId,
                              e.target.checked
                            )
                          }
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      )}
                      {/* Spacer when not in removal mode */}
                      {!isRemovalMode && <div className="w-4" />}

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{user.FullName}</span>
                          <Badge variant="secondary" className="text-xs">
                            {user.RoleName}
                          </Badge>
                          {user.AssignmentType === "auditor" && (
                            <Badge
                              variant="outline"
                              className="text-xs text-blue-600"
                            >
                              Auditor
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {user.Email}
                        </div>
                      </div>
                      {/* Remove button only for staff when in removal mode */}
                      {user.RoleRank === 5 && isRemovalMode && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const confirmRemove = confirm(
                              `Remove ${user.FullName} from ${selectedBranch?.BranchName}?\n\n` +
                                `This will unassign this staff member from the branch.`
                            );
                            if (confirmRemove) {
                              handleRemoveStaffFromBranch(
                                user.UserId,
                                selectedBranch!
                              );
                            }
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No users assigned to this branch</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setIsUserDialogOpen(false);
                      fetchStaff().then(() => {
                        setIsStaffDialogOpen(true);
                      });
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Staff Member
                  </Button>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsUserDialogOpen(false)}
                className="flex-1 bg-transparent"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Area Manager Assignment Dialog */}
      <Dialog
        open={isAreaManagerDialogOpen}
        onOpenChange={setIsAreaManagerDialogOpen}
      >
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Assign Area Manager to Multiple Branches</DialogTitle>
            <DialogDescription>
              Select an area manager and the branches they will manage
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Area Manager Selection */}
            <div className="space-y-3">
              <Label>Select Area Manager</Label>
              <div className="max-h-48 overflow-y-auto border rounded-lg p-2">
                {areaManagers.length > 0 ? (
                  <div className="space-y-2">
                    {areaManagers.map((manager) => (
                      <div
                        key={manager.UserId}
                        className="flex items-center space-x-3 p-2 border rounded hover:bg-muted/50"
                      >
                        <input
                          type="radio"
                          name="areaManager"
                          value={manager.UserId}
                          checked={selectedAreaManagerId === manager.UserId}
                          onChange={(e) =>
                            handleAreaManagerSelectionChange(e.target.value)
                          }
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {manager.FullName}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {manager.RoleName}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {manager.Email} | Currently managing:{" "}
                            {manager.BranchCount || 0} branches
                            {manager.AssignedBranches && (
                              <div className="text-xs text-blue-600 mt-1">
                                Currently: {manager.AssignedBranches}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No area managers found</p>
                  </div>
                )}
              </div>
            </div>

            {/* Branch Selection */}
            <div className="space-y-3">
              <Label>Select Branches to Manage</Label>
              <div className="max-h-64 overflow-y-auto border rounded-lg p-2">
                <div className="grid grid-cols-2 gap-2">
                  {branches.map((branch: any) => (
                    <div
                      key={branch.BranchId}
                      className="flex items-center space-x-2 p-2 border rounded hover:bg-muted/50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedBranchIds.includes(branch.BranchId)}
                        onChange={(e) =>
                          handleBranchSelectionChange(
                            branch.BranchId,
                            e.target.checked
                          )
                        }
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {branch.BranchName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {branch.GroupName}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAreaManagerDialogOpen(false);
                  setSelectedAreaManagerId("");
                  setSelectedBranchIds([]);
                }}
                className="flex-1 bg-transparent"
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1"
                onClick={() => {
                  if (selectedAreaManagerId) {
                    handleAssignAreaManager(
                      selectedAreaManagerId,
                      selectedBranchIds
                    );
                  }
                }}
                disabled={!selectedAreaManagerId}
              >
                {selectedBranchIds.length > 0
                  ? "Assign Area Manager"
                  : "Unassign Area Manager"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Auditor Assignment Dialog */}
      <Dialog open={isAuditorDialogOpen} onOpenChange={setIsAuditorDialogOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Assign Auditor to Area Managers</DialogTitle>
            <DialogDescription>
              Select an auditor and the area managers they will supervise.
              Auditors will have access to all branches, branch managers, and
              staff under their assigned area managers.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Auditor Selection */}
            <div className="space-y-3">
              <Label>Select Auditor</Label>
              <div className="max-h-48 overflow-y-auto border rounded-lg p-2">
                {auditors.length > 0 ? (
                  <div className="space-y-2">
                    {auditors.map((auditor) => (
                      <div
                        key={auditor.UserId}
                        className="flex items-center space-x-3 p-2 border rounded hover:bg-muted/50"
                      >
                        <input
                          type="radio"
                          name="auditor"
                          value={auditor.UserId}
                          checked={selectedAuditorId === auditor.UserId}
                          onChange={(e) =>
                            handleAuditorSelectionChange(e.target.value)
                          }
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {auditor.FullName}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {auditor.RoleName}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {auditor.Email}
                            {auditor.SupervisedAreaManagers && (
                              <div className="text-xs text-blue-600 mt-1">
                                Currently supervising:{" "}
                                {auditor.SupervisedAreaManagers}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No auditors found</p>
                  </div>
                )}
              </div>
            </div>

            {/* Area Manager Selection */}
            <div className="space-y-3">
              <Label>Select Area Managers to Supervise</Label>
              <div className="max-h-64 overflow-y-auto border rounded-lg p-2">
                <div className="space-y-2">
                  {areaManagers.map((manager) => (
                    <div
                      key={manager.UserId}
                      className="flex items-center space-x-3 p-2 border rounded hover:bg-muted/50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedAreaManagerIds.includes(
                          manager.UserId
                        )}
                        onChange={(e) =>
                          handleAreaManagerSelectionForAuditor(
                            manager.UserId,
                            e.target.checked
                          )
                        }
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {manager.FullName}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {manager.RoleName}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {manager.Email} | Managing: {manager.BranchCount || 0}{" "}
                          branches
                          {manager.AssignedBranches && (
                            <div className="text-xs text-blue-600 mt-1">
                              Branches: {manager.AssignedBranches}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAuditorDialogOpen(false);
                  setSelectedAuditorId("");
                  setSelectedAreaManagerIds([]);
                }}
                className="flex-1 bg-transparent"
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1"
                onClick={() => {
                  if (selectedAuditorId) {
                    handleAssignAuditorToAreaManagers(
                      selectedAuditorId,
                      selectedAreaManagerIds
                    );
                  }
                }}
                disabled={!selectedAuditorId}
              >
                {selectedAreaManagerIds.length > 0
                  ? "Assign Auditor to Area Managers"
                  : "Unassign Auditor from All Area Managers"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
