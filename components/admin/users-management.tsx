"use client";

import type React from "react";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import {
  fetchUsersMinimal,
  createUser,
  updateUser,
  deleteUser,
} from "@/redux/modules/users/actions";
import { fetchBranches } from "@/redux/modules/branches/actions";
import { fetchPositions } from "@/redux/modules/positions/actions";
import { fetchRoles } from "@/redux/modules/roles/actions";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Users,
  UserCheck,
  Building,
} from "lucide-react";
// Import the virtualization hook
import { useVirtualizer } from "@tanstack/react-virtual";

// --- Debounce Hook (put this in hooks/useDebounce.ts or keep it here) ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
// --- End Debounce Hook ---

interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  phone: string;
  emiratesId: string;
  gender: "male" | "female" | "other";
  staffId: string;
  role:
    | "staff"
    | "branch_manager"
    | "area_manager"
    | "auditor"
    | "management"
    | "admin";
  position: string;
  rank: number;
  branch: string;
  status: "active" | "inactive";
  lastLogin: string;
  createdAt: string;
}

// Define role-specific positions mapping
// const ROLE_POSITIONS = {
//   staff: [
//     "Pharmacist",
//     "Assistant Pharmacist",
//     "Pharmacy Technician",
//     "Cashier",
    "HR",
//     "Inventory Clerk",
//     "Customer Service Representative",
//   ],
//   branch_manager: ["Branch Manager", "Pharmacy Manager"],
//   area_manager: ["Area Manager", "Regional Supervisor"],
//   auditor: [
//     "Quality Control Supervisor",
//     "Compliance Auditor",
//     "Regulatory Inspector",
//   ],
//   management: [
//     "Chief Executive Officer (CEO)",
//     "Owner",
//     "Operations Director",
//     "Pharmacy Director",
//   ],
//   admin: ["System Administrator", "IT Manager"],
// };

export function UsersManagement() {
  const dispatch = useDispatch();

  // --- OPTIMIZED SELECTORS ---
  // This prevents re-renders when only 'loading' or 'error' changes
  const users = useSelector((state: RootState) => state.users.items);
  const loading = useSelector((state: RootState) => state.users.loading);
  const error = useSelector((state: RootState) => state.users.error);
  const branches = useSelector((state: RootState) => state.branches.items);
  const positions = useSelector((state: RootState) => state.positions.items);
  const roles = useSelector((state: RootState) => state.roles.items);
  // ---

  useEffect(() => {
    dispatch(fetchUsersMinimal() as any);
    dispatch(fetchBranches() as any);
    dispatch(fetchPositions() as any);
    dispatch(fetchRoles() as any);
  }, [dispatch]);

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [positionFilter, setPositionFilter] = useState<string>("all");

  // --- DEBOUNCED SEARCH ---
  // This waits 300ms after the user stops typing before filtering
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Re-fetch users when branch filter changes
  useEffect(() => {
    if (branchFilter === "all") {
      dispatch(fetchUsersMinimal() as any);
    } else {
      const selectedBranch = branches.find(
        (b: any) => b.BranchName === branchFilter
      );
      if (selectedBranch) {
        dispatch(fetchUsersMinimal(selectedBranch.BranchId) as any);
      }
    }
  }, [branchFilter, branches, dispatch]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
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
  });

  // --- MEMOIZED & CALLBACK FUNCTIONS ---

  // Find and delete the old getFilteredPositions function and REPLACE it with this:
  const getFilteredPositions = useCallback(
    (selectedRole: string) => {
      // 1. If no role is selected, show only "Global" positions
      if (!selectedRole) {
        return positions.filter((pos: any) => !pos.RoleRankId);
      }

      // 2. Find the full Role object (from Redux)
      const selectedRoleObj = roles.find((r: any) => r.Name === selectedRole);

      // 3. If the role can't be found, return empty
      if (!selectedRoleObj) {
        return [];
      }

      const targetRoleRankId = selectedRoleObj.RoleRankId;

      // 4. Return ONLY positions that strictly match the selected role's ID
      return positions.filter((pos: any) => {
        return pos.RoleRankId === targetRoleRankId;
      });
    },
    [positions, roles] // Make sure dependencies are correct
  );

  // --- MEMOIZED FILTERED USERS ---
  // This calculation only runs when its dependencies change
  const filteredUsers = useMemo(() => {
    // Use the debouncedSearchTerm here
    const hasExactStaffIdMatch =
      debouncedSearchTerm.trim() &&
      users.some(
        (user: any) =>
          (user.staffId || "").toLowerCase() ===
          debouncedSearchTerm.toLowerCase().trim()
      );

    return users.filter((user: any) => {
      const searchLower = debouncedSearchTerm.toLowerCase().trim();
      const userStaffId = (user.staffId || "").toLowerCase();

      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus =
        statusFilter === "all" || user.status === statusFilter;
      const matchesBranch =
        branchFilter === "all" || user.branch === branchFilter;
      const userPosition = user.position || "";
      const matchesPosition =
        positionFilter === "all" || userPosition === positionFilter;

      if (!debouncedSearchTerm.trim()) {
        return matchesRole && matchesStatus && matchesBranch && matchesPosition;
      }

      if (hasExactStaffIdMatch) {
        return (
          userStaffId === searchLower &&
          matchesRole &&
          matchesStatus &&
          matchesBranch &&
          matchesPosition
        );
      }

      const matchesSearch =
        (user.name || "").toLowerCase().includes(searchLower) ||
        (user.email || "").toLowerCase().includes(searchLower) ||
        (user.phone || "").toLowerCase().includes(searchLower) ||
        userStaffId.includes(searchLower) ||
        (user.emiratesId || "").toLowerCase().includes(searchLower);

      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus &&
        matchesBranch &&
        matchesPosition
      );
    });
  }, [
    users,
    debouncedSearchTerm,
    roleFilter,
    statusFilter,
    branchFilter,
    positionFilter,
  ]);

  const handleRoleChange = useCallback(
    (newRole: string) => {
      const updatedFormData = { ...formData, role: newRole };
      const filteredPositions = getFilteredPositions(newRole);
      const isCurrentPositionValid = filteredPositions.some(
        (pos: any) => pos.Name === formData.position
      );

      if (!isCurrentPositionValid) {
        updatedFormData.position = "";
      }
      setFormData(updatedFormData);
    },
    [formData, getFilteredPositions]
  );

  const handleCreateUser = useCallback(() => {
    setEditingUser(null);
    setFormData({
      firstName: "",
      lastName: "",
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
    });
    setIsDialogOpen(true);
  }, []);

  const handleEditUser = useCallback((user: any) => {
    const [firstName, ...lastNameParts] = (user.name || "").split(" ");
    const lastName = lastNameParts.join(" ");

    setEditingUser(user);
    const newFormData = {
      firstName: firstName || "",
      lastName: lastName || "",
      email: user.email,
      password: "",
      phone: user.phone,
      emiratesId: user.emiratesId,
      gender: user.gender?.toLowerCase() || "",
      staffId: user.staffId,
      role: user.role,
      position: user.position,
      rank: user.rank,
      status: user.status,
    };
    setFormData(newFormData);
    setIsDialogOpen(true);
  }, []);

  const handleDeleteUser = useCallback(
    (userId: string) => {
      if (confirm("Are you sure you want to delete this user?")) {
        dispatch(deleteUser(userId) as any);
      }
    },
    [dispatch]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      const backendData: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        emiratesId: formData.emiratesId,
        gender: formData.gender,
        password: formData.password,
        staffId: formData.staffId,
        positionId: positions.find((p: any) => p.Name === formData.position)
          ?.PositionId,
        isActive: formData.status === "active",
      };

      const selectedRole = roles.find((r: any) => r.Name === formData.role);
      if (selectedRole) {
        backendData.roleRankId = selectedRole.RoleRankId;
      }

      if (editingUser) {
        dispatch(updateUser(editingUser.id, backendData) as any);
      } else {
        dispatch(createUser(backendData) as any);
      }

      setIsDialogOpen(false);
    },
    [dispatch, formData, editingUser, positions, roles]
  );

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
      case "management":
        return "default";
      case "area_manager":
      case "branch_manager":
        return "secondary";
      case "auditor":
        return "outline";
      case "staff":
        return "outline";
      default:
        return "outline";
    }
  };

  const getRankColor = (rank: number) => {
    if (rank <= 2) return "default";
    if (rank <= 4) return "secondary";
    if (rank <= 6) return "outline";
    return "outline";
  };

  const formatDate = (dateString: string) => {
    if (dateString === "Never") return "Never";
    return new Date(dateString).toLocaleDateString();
  };

  const formatLastLogin = (dateString: string) => {
    if (dateString === "Never") return "Never";
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    }
  };

  // --- VIRTUALIZATION SETUP ---
  // 1. Create a ref for the scrolling container
  const parentRef = useRef<HTMLDivElement>(null);

  // 2. Set up the virtualizer
  const rowVirtualizer = useVirtualizer({
    count: filteredUsers.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 105, // Manually set this to the avg height of your row
    overscan: 5, // Render 5 extra rows above/below the viewport
  });
  // --- END VIRTUALIZATION SETUP ---

  if (loading && users.length === 0) {
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
      {/* ... (Header, Stats Cards, Filters section are all unchanged) ... */}

      {/* (Header: "Users Management") */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Users Management
          </h1>
          <p className="text-muted-foreground">
            Manage user accounts and permissions
          </p>
        </div>
        <Button onClick={handleCreateUser}>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* (Stats Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {users.length}
            </div>
            <p className="text-xs text-muted-foreground">Registered accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {users.filter((u: any) => u.status === "active").length}
            </div>
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
              {
                users.filter(
                  (u: any) =>
                    u.role.includes("manager") || u.role === "management"
                ).length
              }
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
            <div className="text-2xl font-bold text-gray-600">
              {users.filter((u: any) => u.role === "staff").length}
            </div>
            <p className="text-xs text-muted-foreground">Staff members</p>
          </CardContent>
        </Card>
      </div>

      {/* (Filters Card) */}
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

      {/* --- VIRTUALIZED USERS TABLE --- */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length} found)</CardTitle>
          <CardDescription>
            Manage user accounts, roles, and permissions
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {/* 3. This is the scrolling container with the ref and a FIXED HEIGHT */}
          <div
            ref={parentRef}
            className="overflow-x-auto"
            style={{
              height: "600px", // <-- THIS IS CRITICAL
              overflowY: "auto",
            }}
          >
            <table className="w-full">
              <thead
                className="border-b"
                style={{
                  position: "sticky",
                  top: 0,
                  zIndex: 1,
                  backgroundColor: "hsl(var(--card))", // Match card background
                }}
              >
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
              {/* 4. This tbody is positioned relatively and given a total height */}
              <tbody
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: "100%",
                  position: "relative",
                }}
              >
                {/* 5. Map over the VIRTUAL items, not the full array */}
                {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                  const user = filteredUsers[virtualItem.index];

                  return (
                    <tr
                      key={user.id}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: `${virtualItem.size}px`,
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                      className="border-b hover:bg-muted/50"
                    >
                      {/* --- All your original <td> cells go here --- */}
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {user.email}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ID: {user.staffId} • {user.phone}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={getRoleColor(user.role)}
                          className="text-xs"
                        >
                          {user.role.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm">{user.position}</td>
                      <td className="p-4">
                        <Badge
                          variant={getRankColor(user.rank)}
                          className="text-xs"
                        >
                          {user.rank}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm">{user.branch}</td>
                      <td className="p-4">
                        <Badge
                          variant={
                            user.status === "active" ? "default" : "secondary"
                          }
                          className="text-xs"
                        >
                          {user.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm">
                        {formatLastLogin(user.lastLogin)}
                      </td>
                      <td className="p-4 text-sm">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                          >
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

      {/* --- User Dialog (Unchanged) --- */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Edit User" : "Create New User"}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? "Update user information and permissions."
                : "Add a new user to the system with complete profile information."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
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
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
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
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="+971501234567"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emiratesId">Emirates ID</Label>
                <Input
                  id="emiratesId"
                  value={formData.emiratesId}
                  onChange={(e) =>
                    setFormData({ ...formData, emiratesId: e.target.value })
                  }
                  placeholder="784-YYYY-XXXXXXX-X"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
                <Select
                  key={editingUser ? `gender-${editingUser.id}` : "gender-new"}
                  value={formData.gender}
                  onValueChange={(value) =>
                    setFormData({ ...formData, gender: value })
                  }
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
                  onChange={(e) =>
                    setFormData({ ...formData, staffId: e.target.value })
                  }
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
                    <SelectItem value="branch_manager">
                      Branch Manager
                    </SelectItem>
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
                  onValueChange={(value) =>
                    setFormData({ ...formData, position: value })
                  }
                  disabled={!formData.role}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        formData.role ? "Select position" : "Select role first"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {getFilteredPositions(formData.role).map(
                      (position: any) => (
                        <SelectItem
                          key={position.PositionId}
                          value={position.Name}
                        >
                          {position.Name}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
                {formData.role && (
                  <p className="text-xs text-muted-foreground">
                    Showing positions for {formData.role.replace("_", " ")} role
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                Rank will be automatically assigned based on the selected role
              </Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
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
                {editingUser ? "Update User" : "Create User"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
