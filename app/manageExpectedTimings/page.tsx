// This is the full, updated page.tsx for ManageExpectedTimings
// FIX: Corrected the 'formatTimeForInput' function to not use new Date() for parsing

"use client";
import React, { useState, useEffect, useCallback } from "react";
import useDebounce from "../../hooks/useDebounce";
import {
  Users,
  Clock,
  Settings,
  X,
  Loader2,
  AlertTriangle,
  Save,
  Filter,
  Search,
  RefreshCw,
  CalendarDays,
  Sun,
} from "lucide-react";

// --- CONFIGURATION ---
const API_BASE_URL = "http://localhost:5050"; // <-- REMOVED /api prefix

// --- TYPES ---
interface UserSummary {
  id: string;
  name: string;
  email: string;
  phone: string;
  staffId: string;
  role: string;
  position: string;
  branch?: string;
}

interface ExpectedTimings {
  UserId: string;
  ExpectedCheckIn: string;
  ExpectedCheckOut: string;
  ExpectedBreakIn: string | null;
  ExpectedBreakOut: string | null;
}

// NEW TYPE for availability
interface UserAvailability {
  isAvailable: boolean;
  availabilityStatus: "Available" | "OnLeave" | "Sick" | "Unavailable";
  leaveStartDate: string | null;
  leaveEndDate: string | null;
}

interface FilterOption {
  id: string;
  name: string;
}

interface UserFilters {
  branchId: string;
  positionId: string;
  staffId: string;
}

// --- UTILITY FUNCTIONS ---
const fetchFilterOptions = async (
  endpoint: string
): Promise<FilterOption[]> => {
  const token = localStorage.getItem("token");
  if (!token) return [];
  try {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) {
      const fullResponse = await response.json();
      const dataToMap = fullResponse.items || [];
      return dataToMap.map((item: any) => ({
        id: item.BranchId || item.PositionId || item.id,
        name: item.BranchName || item.Name || item.name,
      }));
    }
  } catch (error) {
    console.error(`Failed to fetch /${endpoint}:`, error);
  }
  return [];
};

const fetchApi = async (url: string, method: string = "GET", body?: any) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Authentication token not found.");
  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  const response = await fetch(`${API_BASE_URL}${url}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `API Error: ${response.statusText}`);
  }
  return response.json();
};

// Helper to format date for input[type="date"] (YYYY-MM-DD)
const formatDateForInput = (date: string | null | Date): string => {
  if (!date) return "";
  try {
    return new Date(date).toISOString().split("T")[0];
  } catch (e) {
    return "";
  }
};

// --- CORRECTED HELPER FUNCTION ---
// Formats a time string (HH:MM:SS or full ISO) into just HH:MM:SS
const formatTimeForInput = (time: string | null): string => {
  if (!time) return "";

  // Check if it's a full ISO date string (e.g., "1970-01-01T09:19:57.000Z")
  if (time.includes("T")) {
    try {
      // Just split the string, don't use new Date() which causes timezone issues
      return time.split("T")[1].split(".")[0];
    } catch (e) {
      return ""; // Invalid date string
    }
  }

  // Check if it's already in HH:MM:SS format (from 'NVarChar(8)' SQL type)
  if (time.match(/^\d{2}:\d{2}:\d{2}$/)) {
    return time;
  }

  // Fallback for other formats (like HH:MM)
  if (time.match(/^\d{2}:\d{2}$/)) {
    return `${time}:00`;
  }

  return ""; // Default fallback
};

// --- COMPONENTS ---

// UPDATED Expected Timings & Availability Modal
const ConfigModal: React.FC<{
  user: UserSummary;
  onClose: () => void;
  onSaveSuccess: () => void;
}> = ({ user, onClose, onSaveSuccess }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for Timings
  const [timingsData, setTimingsData] = useState<ExpectedTimings>({
    UserId: user.id,
    ExpectedCheckIn: "09:00:00",
    ExpectedCheckOut: "18:00:00",
    ExpectedBreakIn: null,
    ExpectedBreakOut: null,
  });

  // NEW State for Availability
  const [availabilityData, setAvailabilityData] = useState<UserAvailability>({
    isAvailable: true,
    availabilityStatus: "Available",
    leaveStartDate: null,
    leaveEndDate: null,
  });

  // Fetch existing config (BOTH timings and availability)
  useEffect(() => {
    const loadConfiguration = async () => {
      setLoading(true);
      setError(null);
      try {
        // Use the NEW single endpoint
        const data = await fetchApi(`/users/${user.id}/configuration`);

        // Set timings data
        if (data.expectedTimings) {
          setTimingsData({
            UserId: user.id,
            // USE THE FORMATTER HERE
            ExpectedCheckIn:
              formatTimeForInput(data.expectedTimings.ExpectedCheckIn) ||
              "09:00:00",
            ExpectedCheckOut:
              formatTimeForInput(data.expectedTimings.ExpectedCheckOut) ||
              "18:00:00",
            ExpectedBreakIn:
              formatTimeForInput(data.expectedTimings.ExpectedBreakIn) || null,
            ExpectedBreakOut:
              formatTimeForInput(data.expectedTimings.ExpectedBreakOut) || null,
          });
        }

        // Set availability data
        if (data.availability) {
          setAvailabilityData({
            isAvailable: data.availability.IsAvailable,
            availabilityStatus:
              data.availability.AvailabilityStatus || "Available",
            leaveStartDate: data.availability.LeaveStartDate || null,
            leaveEndDate: data.availability.LeaveEndDate || null,
          });
        }
      } catch (err: any) {
        console.error("Failed to fetch configuration:", err);
        setError(
          "Could not load existing configuration. Using default values."
        );
      } finally {
        setLoading(false);
      }
    };
    loadConfiguration();
  }, [user.id]);

  // --- Handlers for Form Inputs ---
  const handleTimingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTimingsData((prev) => ({
      ...prev,
      [name]: value === "" ? null : value,
    }));
  };

  const handleAvailabilityChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setAvailabilityData((prev) => {
      const newStatus =
        name === "availabilityStatus" ? value : prev.availabilityStatus;
      const isAvailable = newStatus === "Available"; // Auto-set isAvailable

      return {
        ...prev,
        [name]: value === "" ? null : value,
        isAvailable: isAvailable,
        availabilityStatus: newStatus as UserAvailability["availabilityStatus"],
      };
    });
  };

  // UPDATED Save Handler (saves to two endpoints)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      // 1. Save Timings
      if (!timingsData.ExpectedCheckIn || !timingsData.ExpectedCheckOut) {
        throw new Error("Check-In and Check-Out times are required.");
      }
      await fetchApi(`/users/expected-timings`, "POST", timingsData);

      // 2. Save Availability
      await fetchApi(
        `/users/${user.id}/availability`,
        "PATCH",
        availabilityData
      );

      onSaveSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save configuration.");
      setSaving(false);
    }
  };

  // --- Reusable Input Components ---
  const TimeInput: React.FC<{
    label: string;
    name: keyof ExpectedTimings;
    required?: boolean;
  }> = ({ label, name, required = false }) => (
    <div className="flex-1 min-w-0">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="time"
        step="1"
        name={name}
        // AND USE THE FORMATTER HERE
        value={formatTimeForInput(timingsData[name])}
        onChange={handleTimingsChange}
        required={required}
        className="mt-1 block w-full px-3 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:bg-gray-50"
        disabled={loading || saving}
      />
    </div>
  );

  const DateInput: React.FC<{
    label: string;
    name: keyof UserAvailability;
  }> = ({ label, name }) => (
    <div className="flex-1 min-w-0">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type="date"
        name={name}
        value={formatDateForInput(availabilityData[name])}
        onChange={handleAvailabilityChange}
        className="mt-1 block w-full px-3 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:bg-gray-50"
        disabled={
          loading || saving || availabilityData.availabilityStatus !== "OnLeave"
        }
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-bold mb-1">User Configuration</h2>
          <p className="text-indigo-100 text-lg">{user.name}</p>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6">
          {loading ? (
            <div className="text-center py-10 text-indigo-600">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" />
              <p>Loading user configuration...</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {/* === Working Hours Section === */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-indigo-500" />
                  Working Hours
                </h3>
                <div className="flex flex-col sm:flex-row gap-4">
                  <TimeInput
                    label="Expected Check In"
                    name="ExpectedCheckIn"
                    required
                  />
                  <TimeInput
                    label="Expected Check Out"
                    name="ExpectedCheckOut"
                    required
                  />
                </div>
              </div>

              {/* === Break Times Section === */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-indigo-500" />
                  Break Times (Optional)
                </h3>
                <div className="flex flex-col sm:flex-row gap-4">
                  <TimeInput label="Expected Break In" name="ExpectedBreakIn" />
                  <TimeInput
                    label="Expected Break Out"
                    name="ExpectedBreakOut"
                  />
                </div>
              </div>

              {/* === NEW Availability & Leave Section === */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 flex items-center">
                  <Sun className="w-4 h-4 mr-2 text-purple-500" />
                  Availability & Leave
                </h3>
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Status Dropdown */}
                  <div className="flex-1 min-w-0">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Availability Status
                    </label>
                    <select
                      name="availabilityStatus"
                      value={availabilityData.availabilityStatus}
                      onChange={handleAvailabilityChange}
                      className="mt-1 block w-full px-3 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:bg-gray-50"
                      disabled={loading || saving}
                    >
                      <option value="Available">Available</option>
                      <option value="OnLeave">On Leave</option>
                      <option value="Sick">Sick</option>
                      <option value="Unavailable">Unavailable</option>
                    </select>
                  </div>
                </div>

                {/* Leave Date Pickers (show only if "OnLeave") */}
                {availabilityData.availabilityStatus === "OnLeave" && (
                  <div className="flex flex-col sm:flex-row gap-4 p-4 bg-indigo-50 rounded-lg">
                    <DateInput label="Leave Start Date" name="leaveStartDate" />
                    <DateInput label="Leave End Date" name="leaveEndDate" />
                  </div>
                )}
              </div>
            </>
          )}

          {/* Footer/Action Buttons */}
          <div className="pt-4 border-t flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium disabled:opacity-50"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium flex items-center disabled:opacity-50"
              disabled={loading || saving}
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Save className="w-5 h-5 mr-2" />
              )}
              {saving ? "Saving..." : "Save Configuration"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main User Management Component (UPDATED with correct filter logic)
const ManageExpectedTimings = () => {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null);

  // Filter State
  const [branches, setBranches] = useState<FilterOption[]>([]);
  const [positions, setPositions] = useState<FilterOption[]>([]);
  const [currentFilters, setCurrentFilters] = useState<UserFilters>({
    branchId: "All Branches",
    positionId: "All Positions",
    staffId: "",
  });
  const [isFilterLoading, setIsFilterLoading] = useState(false);

  const debouncedBranchId = useDebounce(currentFilters.branchId, 500); // 500ms delay
  const debouncedPositionId = useDebounce(currentFilters.positionId, 500);
  const debouncedStaffId = useDebounce(currentFilters.staffId, 500);

  // --- Filter Option Fetching (Using your provided logic) ---
  useEffect(() => {
    const loadFilters = async () => {
      setIsFilterLoading(true);
      const [branchList, positionList] = await Promise.all([
        fetchFilterOptions("branches"),
        fetchFilterOptions("positions"),
      ]);
      setBranches(branchList);
      setPositions(positionList);
      setIsFilterLoading(false);
    };
    loadFilters();
  }, []);

  // --- User Fetching with Filters ---
  // const fetchUsers = useCallback(async () => {
  //   setLoading(true);
  //   setError(null);
  //   try {
  //     const { branchId } = currentFilters; // Only fetch by branchId from API
  //     const params = new URLSearchParams();
  //     if (branchId !== "All Branches") params.append("branchId", branchId);

  //     const queryString = params.toString();
  //     const url = `/users/minimal${queryString ? `?${queryString}` : ""}`;

  //     const data = await fetchApi(url);
  //     let filteredUsers: UserSummary[] = data.items || [];

  //     // Client-side filter for position (as per your original logic)
  //     const { positionId } = currentFilters;
  //     if (positionId !== "All Positions") {
  //       const selectedPositionName = positions.find(
  //         (p) => p.id === positionId
  //       )?.name;
  //       if (selectedPositionName) {
  //         filteredUsers = filteredUsers.filter(
  //           (user) => user.position === selectedPositionName
  //         );
  //       }
  //     }

  //     setUsers(filteredUsers);
  //   } catch (err: any) {
  //     setError(err.message || "Failed to fetch user list.");
  //     setUsers([]);
  //   } finally {
  //     setLoading(false);
  //   }
  // }, [currentFilters, positions]); // Added positions as dependency

  // --- User Fetching with Filters ---
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Use DEBOUNCED values for the API call
      const params = new URLSearchParams();
      // Check debounced values against placeholders/empty strings
      if (debouncedBranchId && debouncedBranchId !== "All Branches")
        params.append("branchId", debouncedBranchId);
      if (debouncedPositionId && debouncedPositionId !== "All Positions")
        params.append("positionId", debouncedPositionId);
      if (debouncedStaffId) params.append("staffId", debouncedStaffId); // Use debouncedStaffId

      const queryString = params.toString();
      const url = `/users/minimal${queryString ? `?${queryString}` : ""}`;

      const data = await fetchApi(url);
      setUsers(data.items || []); // Set users directly (backend handles filtering)
    } catch (err: any) {
      setError(err.message || "Failed to fetch user list.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
    // Update dependencies to DEBOUNCED values
  }, [debouncedBranchId, debouncedPositionId, debouncedStaffId]); // <-- USE DEBOUNCED VALUES HERE

  useEffect(() => {
    // Fetch users when component mounts or filters change
    fetchUsers();
  }, [fetchUsers]);

  // --- Handler Functions ---
  const handleFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setCurrentFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleResetFilters = () => {
    setCurrentFilters({
      branchId: "All Branches",
      positionId: "All Positions",
      staffId: "",
    });
  };

  const handleEditConfig = (user: UserSummary) => {
    // Renamed for clarity
    setSelectedUser(user);
  };

  // --- Filter UI Component ---
  const FilterDropdown: React.FC<{
    label: string;
    name: keyof UserFilters;
    options: FilterOption[];
  }> = ({ label, name, options }) => {
    const placeholder = `All ${label.split(" ")[2] || label}`;
    return (
      <div className="flex flex-col flex-1 min-w-[150px]">
        <label className="text-xs font-semibold text-gray-600 mb-1">
          {label}
        </label>
        <div className="relative">
          <select
            name={name}
            value={currentFilters[name]}
            onChange={handleFilterChange}
            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm focus:ring-indigo-500 focus:border-indigo-500 appearance-none pr-10"
            disabled={isFilterLoading || loading}
          >
            <option value={placeholder}>{placeholder}</option>
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 md:p-10 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8 pb-2">
        <Settings className="inline w-8 h-8 mr-3 text-purple-600" />
        {" User Configuration"}
      </h1>

      {/* Filter Data Section */}
      <div className="bg-white p-5 rounded-2xl shadow-lg mb-8 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <Filter className="w-5 h-5 mr-2 text-indigo-500" />
          Filter Data
          {isFilterLoading && (
            <Loader2 className="w-4 h-4 ml-3 animate-spin text-indigo-500" />
          )}
        </h3>
        <div className="flex flex-wrap gap-4 items-end">
          <FilterDropdown
            label="Filter by Branch"
            name="branchId"
            options={branches}
          />
          <FilterDropdown
            label="Filter by Position"
            name="positionId"
            options={positions}
          />

          <div className="flex flex-col flex-1 min-w-[150px]">
            <label className="text-xs font-semibold text-gray-600 mb-1">
              Filter by Staff ID
            </label>
            <div className="relative">
              <input
                type="text"
                name="staffId" // Ensure name matches state key
                value={currentFilters.staffId}
                onChange={handleFilterChange} // Use the updated handler
                placeholder="Enter Staff ID..."
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm focus:ring-indigo-500 focus:border-indigo-500 pr-10" // Added padding-right
                disabled={isFilterLoading || loading}
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm font-medium flex items-center disabled:opacity-50 min-h-[42px]"
            disabled={loading || isFilterLoading}
            title="Reset Filters"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Reset
          </button>
        </div>
      </div>

      {/* User List Table */}
      <div className="bg-white shadow-2xl rounded-2xl overflow-hidden border border-gray-200">
        <h2 className="text-xl font-semibold p-6 border-b bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 flex items-center">
          <Users className="w-5 h-5 mr-2 text-indigo-500" />
          Employee List
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {" "}
                  Employee{" "}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {" "}
                  Staff ID{" "}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {" "}
                  Position{" "}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {" "}
                  Role{" "}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {" "}
                  Action{" "}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  {" "}
                  <td colSpan={5} className="text-center py-12 text-indigo-600">
                    {" "}
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />{" "}
                    <p className="text-sm">Loading user list...</p>{" "}
                  </td>{" "}
                </tr>
              ) : error ? (
                <tr>
                  {" "}
                  <td colSpan={5} className="text-center py-12 text-gray-500">
                    {" "}
                    <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-red-500" />{" "}
                    <p className="text-red-700">Error: {error}</p>{" "}
                  </td>{" "}
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  {" "}
                  <td colSpan={5} className="text-center py-12 text-gray-500">
                    {" "}
                    <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-yellow-500" />{" "}
                    <p>No active users found matching the current filters.</p>
                  </td>{" "}
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-indigo-50 transition duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {user.name}
                      </div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {user.staffId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {user.position || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 text-sm font-semibold text-purple-800 bg-purple-100 rounded-full">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleEditConfig(user)}
                        className="px-4 py-2 text-indigo-600 bg-indigo-100 rounded-lg hover:bg-indigo-200 transition text-sm font-medium flex items-center"
                      >
                        <Clock className="w-4 h-4 mr-1" />
                        Set Config
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL (now renamed) */}
      {selectedUser && (
        <ConfigModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onSaveSuccess={fetchUsers} // Refreshes user list on save
        />
      )}
    </div>
  );
};

export default ManageExpectedTimings;

//==================================================

// "use client";
// import React, { useState, useEffect, useCallback } from "react";
// import {
//   Users,
//   Clock,
//   Settings,
//   X,
//   Loader2,
//   AlertTriangle,
//   Save,
//   Filter,
//   Search,
//   RefreshCw,
// } from "lucide-react";

// // --- CONFIGURATION ---
// const API_BASE_URL = "http://localhost:5050";

// // --- TYPES ---
// interface UserSummary {
//   id: string; // UserId
//   name: string; // FullName
//   email: string;
//   phone: string;
//   staffId: string;
//   role: string; // RoleName
//   position: string; // PositionName
//   branch?: string; // Branch Name
// }

// interface ExpectedTimings {
//   UserId: string;
//   ExpectedCheckIn: string;
//   ExpectedCheckOut: string;
//   ExpectedBreakIn: string | null;
//   ExpectedBreakOut: string | null;
// }

// interface FilterOption {
//   id: string;
//   name: string;
// }

// interface UserFilters {
//   branchId: string;
//   positionId: string;
// }

// // --- UTILITY FUNCTIONS ---

// // Using the user-provided structure for fetching filter options
// const fetchFilterOptions = async (
//   endpoint: string
// ): Promise<FilterOption[]> => {
//   const token = localStorage.getItem("token");
//   if (!token) return [];

//   try {
//     const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
//       headers: { Authorization: `Bearer ${token}` },
//     });

//     if (response.ok) {
//       const fullResponse = await response.json();
//       const dataToMap = fullResponse.items || [];

//       // Flexible mapping to handle different key names from various endpoints
//       return dataToMap.map((item: any) => ({
//         id: item.BranchId || item.PositionId || item.id,
//         name: item.BranchName || item.Name || item.name, // Adjusted to match your logic
//       }));
//     } else {
//       console.error(`API /${endpoint} failed:`, await response.text());
//     }
//   } catch (error) {
//     console.error(`Failed to fetch /${endpoint}:`, error);
//   }
//   return [];
// };

// // Main API fetcher for other requests
// const fetchApi = async (url: string, method: string = "GET", body?: any) => {
//   const token = localStorage.getItem("token");
//   if (!token) throw new Error("Authentication token not found.");

//   const headers: HeadersInit = {
//     Authorization: `Bearer ${token}`,
//     "Content-Type": "application/json",
//   };

//   const response = await fetch(`${API_BASE_URL}${url}`, {
//     method,
//     headers,
//     body: body ? JSON.stringify(body) : undefined,
//   });

//   if (!response.ok) {
//     const errorData = await response.json();
//     throw new Error(errorData.message || `API Error: ${response.statusText}`);
//   }

//   return response.json();
// };

// // --- COMPONENTS ---

// // Expected Timings Management Modal (No changes needed here)
// const ExpectedTimingsModal: React.FC<{
//   user: UserSummary;
//   onClose: () => void;
//   onSaveSuccess: () => void;
// }> = ({ user, onClose, onSaveSuccess }) => {
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [formData, setFormData] = useState<ExpectedTimings>({
//     UserId: user.id,
//     ExpectedCheckIn: "09:00:00",
//     ExpectedCheckOut: "18:00:00",
//     ExpectedBreakIn: null,
//     ExpectedBreakOut: null,
//   });

//   useEffect(() => {
//     const loadTimings = async () => {
//       setLoading(true);
//       setError(null);
//       try {
//         const url = `/users/${user.id}/expected-timings`;
//         const data = await fetchApi(url);
//         if (data) {
//           setFormData({
//             UserId: user.id,
//             ExpectedCheckIn: data.ExpectedCheckIn || "09:00:00",
//             ExpectedCheckOut: data.ExpectedCheckOut || "18:00:00",
//             ExpectedBreakIn: data.ExpectedBreakIn || null,
//             ExpectedBreakOut: data.ExpectedBreakOut || null,
//           });
//         }
//       } catch (err: any) {
//         console.error("Failed to fetch timings:", err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     loadTimings();
//   }, [user.id]);

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({
//       ...prev,
//       [name]: value === "" ? null : value,
//     }));
//   };

//   const handleSave = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setSaving(true);
//     setError(null);
//     try {
//       if (!formData.ExpectedCheckIn || !formData.ExpectedCheckOut) {
//         throw new Error("Check-In and Check-Out times are required.");
//       }
//       const url = `/users/expected-timings`;
//       await fetchApi(url, "POST", formData);
//       onSaveSuccess();
//       onClose();
//     } catch (err: any) {
//       setError(err.message || "Failed to save expected timings.");
//       setSaving(false);
//     }
//   };

//   const TimeInput: React.FC<{
//     label: string;
//     name: keyof ExpectedTimings;
//     required?: boolean;
//   }> = ({ label, name, required = false }) => (
//     <div className="flex-1 min-w-0">
//       <label className="block text-sm font-medium text-gray-700 mb-1">
//         {label} {required && <span className="text-red-500">*</span>}
//       </label>
//       <input
//         type="time"
//         step="1"
//         name={name}
//         value={formData[name] || ""}
//         onChange={handleChange}
//         required={required}
//         className="mt-1 block w-full px-3 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:bg-gray-50"
//         disabled={loading || saving}
//       />
//     </div>
//   );

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//       <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
//         <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl relative">
//           <button
//             onClick={onClose}
//             className="absolute top-4 right-4 p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition"
//           >
//             <X className="w-5 h-5" />
//           </button>
//           <h2 className="text-2xl font-bold mb-1">Set Expected Timings</h2>
//           <p className="text-indigo-100 text-lg">{user.name}</p>
//         </div>
//         <form onSubmit={handleSave} className="p-6 space-y-6">
//           {loading ? (
//             <div className="text-center py-10 text-indigo-600">
//               {" "}
//               <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" />{" "}
//               <p>Loading user configuration...</p>{" "}
//             </div>
//           ) : (
//             <>
//               {error && (
//                 <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center">
//                   {" "}
//                   <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />{" "}
//                   <p className="text-sm">{error}</p>{" "}
//                 </div>
//               )}
//               <div className="space-y-4">
//                 <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 flex items-center">
//                   {" "}
//                   <Clock className="w-4 h-4 mr-2 text-indigo-500" /> Working
//                   Hours{" "}
//                 </h3>
//                 <div className="flex flex-col sm:flex-row gap-4">
//                   <TimeInput
//                     label="Expected Check In"
//                     name="ExpectedCheckIn"
//                     required
//                   />
//                   <TimeInput
//                     label="Expected Check Out"
//                     name="ExpectedCheckOut"
//                     required
//                   />
//                 </div>
//               </div>
//               <div className="space-y-4">
//                 <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 flex items-center">
//                   {" "}
//                   <Clock className="w-4 h-4 mr-2 text-indigo-500" /> Break Times
//                   (Optional){" "}
//                 </h3>
//                 <div className="flex flex-col sm:flex-row gap-4">
//                   <TimeInput label="Expected Break In" name="ExpectedBreakIn" />
//                   <TimeInput
//                     label="Expected Break Out"
//                     name="ExpectedBreakOut"
//                   />
//                 </div>
//                 <p className="text-xs text-gray-500">
//                   {" "}
//                   Leave break fields empty to indicate no expected break time.{" "}
//                 </p>
//               </div>
//             </>
//           )}
//           <div className="pt-4 border-t flex justify-end gap-3">
//             <button
//               type="button"
//               onClick={onClose}
//               className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium disabled:opacity-50"
//               disabled={saving}
//             >
//               {" "}
//               Cancel{" "}
//             </button>
//             <button
//               type="submit"
//               className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium flex items-center disabled:opacity-50"
//               disabled={loading || saving}
//             >
//               {saving ? (
//                 <Loader2 className="w-5 h-5 animate-spin mr-2" />
//               ) : (
//                 <Save className="w-5 h-5 mr-2" />
//               )}
//               {saving ? "Saving..." : "Save Timings"}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// // Main User Management Component (UPDATED with correct filter logic)
// const ManageExpectedTimings = () => {
//   const [users, setUsers] = useState<UserSummary[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null);

//   // Filter State
//   const [branches, setBranches] = useState<FilterOption[]>([]);
//   const [positions, setPositions] = useState<FilterOption[]>([]);
//   const [currentFilters, setCurrentFilters] = useState<UserFilters>({
//     branchId: "All Branches",
//     positionId: "All Positions",
//   });
//   const [isFilterLoading, setIsFilterLoading] = useState(false);

//   // --- Filter Option Fetching (Using your provided logic) ---
//   useEffect(() => {
//     const loadFilters = async () => {
//       setIsFilterLoading(true);
//       const [branchList, positionList] = await Promise.all([
//         fetchFilterOptions("branches"),
//         fetchFilterOptions("positions"),
//       ]);
//       setBranches(branchList);
//       setPositions(positionList);
//       setIsFilterLoading(false);
//     };
//     loadFilters();
//   }, []);

//   // --- User Fetching with Filters ---
//   const fetchUsers = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const { branchId, positionId } = currentFilters;
//       const params = new URLSearchParams();
//       if (branchId !== "All Branches") params.append("branchId", branchId);

//       const queryString = params.toString();
//       const url = `/users/minimal${queryString ? `?${queryString}` : ""}`;

//       const data = await fetchApi(url);

//       let filteredUsers: UserSummary[] = data.items || [];

//       // Since your backend only filters by branch, we filter by position on the client-side.
//       if (positionId !== "All Positions") {
//         const selectedPositionName = positions.find(
//           (p) => p.id === positionId
//         )?.name;
//         filteredUsers = filteredUsers.filter(
//           (user) => user.position === selectedPositionName
//         );
//       }

//       setUsers(filteredUsers);
//     } catch (err: any) {
//       setError(err.message || "Failed to fetch user list.");
//       setUsers([]);
//     } finally {
//       setLoading(false);
//     }
//   }, [currentFilters, positions]);

//   useEffect(() => {
//     fetchUsers();
//   }, [fetchUsers]);

//   // --- Handler Functions ---
//   const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const { name, value } = e.target;
//     setCurrentFilters((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleResetFilters = () => {
//     setCurrentFilters({
//       branchId: "All Branches",
//       positionId: "All Positions",
//     });
//   };

//   const handleEditTimings = (user: UserSummary) => {
//     setSelectedUser(user);
//   };

//   // --- Filter UI Component ---
//   const FilterDropdown: React.FC<{
//     label: string;
//     name: keyof UserFilters;
//     options: FilterOption[];
//   }> = ({ label, name, options }) => {
//     const placeholder = `All ${label.split(" ")[2] || label}`; // e.g., "All Branches"
//     return (
//       <div className="flex flex-col flex-1 min-w-[150px]">
//         <label className="text-xs font-semibold text-gray-600 mb-1">
//           {label}
//         </label>
//         <div className="relative">
//           <select
//             name={name}
//             value={currentFilters[name]}
//             onChange={handleFilterChange}
//             className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm focus:ring-indigo-500 focus:border-indigo-500 appearance-none pr-10"
//             disabled={isFilterLoading || loading}
//           >
//             <option value={placeholder}>{placeholder}</option>
//             {options.map((option) => (
//               <option key={option.id} value={option.id}>
//                 {option.name}
//               </option>
//             ))}
//           </select>
//           <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div className="p-6 md:p-10 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
//       <h1 className="text-4xl font-extrabold text-gray-900 mb-8 pb-2">
//         <Settings className="inline w-8 h-8 mr-3 text-purple-600" />
//         User Timings Configuration
//       </h1>

//       {/* Filter Data Section */}
//       <div className="bg-white p-5 rounded-2xl shadow-lg mb-8 border border-gray-200">
//         <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
//           <Filter className="w-5 h-5 mr-2 text-indigo-500" />
//           Filter Data
//           {isFilterLoading && (
//             <Loader2 className="w-4 h-4 ml-3 animate-spin text-indigo-500" />
//           )}
//         </h3>
//         <div className="flex flex-wrap gap-4 items-end">
//           <FilterDropdown
//             label="Filter by Branch"
//             name="branchId"
//             options={branches}
//           />
//           <FilterDropdown
//             label="Filter by Position"
//             name="positionId"
//             options={positions}
//           />
//           <button
//             onClick={handleResetFilters}
//             className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm font-medium flex items-center disabled:opacity-50 min-h-[42px]"
//             disabled={loading || isFilterLoading}
//             title="Reset Filters"
//           >
//             <RefreshCw className="w-4 h-4 mr-1" />
//             Reset
//           </button>
//         </div>
//       </div>

//       {/* User List Table */}
//       <div className="bg-white shadow-2xl rounded-2xl overflow-hidden border border-gray-200">
//         <h2 className="text-xl font-semibold p-6 border-b bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 flex items-center">
//           <Users className="w-5 h-5 mr-2 text-indigo-500" />
//           Employee List
//         </h2>
//         <div className="overflow-x-auto">
//           <table className="min-w-full divide-y divide-gray-200">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
//                   {" "}
//                   Employee{" "}
//                 </th>
//                 <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
//                   {" "}
//                   Staff ID{" "}
//                 </th>
//                 <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
//                   {" "}
//                   Position{" "}
//                 </th>
//                 <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
//                   {" "}
//                   Role{" "}
//                 </th>
//                 <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
//                   {" "}
//                   Action{" "}
//                 </th>
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {loading ? (
//                 <tr>
//                   {" "}
//                   <td colSpan={5} className="text-center py-12 text-indigo-600">
//                     {" "}
//                     <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />{" "}
//                     <p className="text-sm">Loading user list...</p>{" "}
//                   </td>{" "}
//                 </tr>
//               ) : error ? (
//                 <tr>
//                   {" "}
//                   <td colSpan={5} className="text-center py-12 text-gray-500">
//                     {" "}
//                     <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-red-500" />{" "}
//                     <p className="text-red-700">Error: {error}</p>{" "}
//                   </td>{" "}
//                 </tr>
//               ) : users.length === 0 ? (
//                 <tr>
//                   {" "}
//                   <td colSpan={5} className="text-center py-12 text-gray-500">
//                     {" "}
//                     <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-yellow-500" />{" "}
//                     <p>No active users found matching the current filters.</p>{" "}
//                   </td>{" "}
//                 </tr>
//               ) : (
//                 users.map((user) => (
//                   <tr
//                     key={user.id}
//                     className="hover:bg-indigo-50 transition duration-150"
//                   >
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <div className="text-sm font-medium text-gray-900">
//                         {user.name}
//                       </div>
//                       <div className="text-xs text-gray-500">{user.email}</div>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
//                       {user.staffId}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
//                       {user.position || "N/A"}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <span className="px-3 py-1 text-sm font-semibold text-purple-800 bg-purple-100 rounded-full">
//                         {user.role}
//                       </span>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <button
//                         onClick={() => handleEditTimings(user)}
//                         className="px-4 py-2 text-indigo-600 bg-indigo-100 rounded-lg hover:bg-indigo-200 transition text-sm font-medium flex items-center"
//                       >
//                         <Clock className="w-4 h-4 mr-1" />
//                         Set Timings
//                       </button>
//                     </td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* Expected Timings Modal */}
//       {selectedUser && (
//         <ExpectedTimingsModal
//           user={selectedUser}
//           onClose={() => setSelectedUser(null)}
//           onSaveSuccess={fetchUsers}
//         />
//       )}
//     </div>
//   );
// };

// export default ManageExpectedTimings;
