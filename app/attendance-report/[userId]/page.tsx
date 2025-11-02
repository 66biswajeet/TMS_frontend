"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  Loader2,
  AlertTriangle,
  Calendar,
  Search,
  User,
  Check,
  X,
  Coffee,
  Moon,
  TrendingUp,
  Clock,
  Briefcase, // Placeholder if needed
  PieChart, // For modal graph title
  AlertCircle, // Icon for Late/OT notes
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
  CartesianGrid, // Ensure this is imported
} from "recharts";

import { showSuccess, showError } from "@/lib/toast";
// --- CONFIGURATION ---
const API_BASE_URL = "http://localhost:5050"; // Use your actual API base URL
const EXPECTED_WORK_MINUTES = 480; // 8 hours (8 * 60). Used for Overtime calc in graph

// --- TYPES ---
interface ReportRow {
  attendanceId: string;
  date: string; // YYYY-MM-DD
  status: "Present" | "Absent" | "Holiday" | "Sunday Holiday" | "On Leave";
  checkIn: string | null; // ISO Date String
  checkOut: string | null; // ISO Date String
  breakIn: string | null; // ISO Date String
  breakOut: string | null; // ISO Date String
  totalWorkMinutes: number;
  totalBreakMinutes: number;
  lateMinutes: number;
  overtimeMinutes: number;
  selfiePhotoUrl: string | null;
}

interface UserDetails {
  id: string;
  name: string | null; // Name can be null
  email: string | null;
  phone: string | null;
  emiratesId: string | null;
  gender: string | null;
  staffId: string | null;
  role: string | null;
  rank: number | null;
  position: string | null;
  status: string | null;
  branch: string | null; // BranchName
  lastLogin: string | null; // ISO Date String
  createdAt: string | null; // ISO Date String
  ExpectedCheckIn?: string | null;
  ExpectedCheckOut?: string | null;
  ExpectedBreakIn?: string | null;
  ExpectedBreakOut?: string | null;
}

interface ReportSummary {
  totalPresent: number;
  totalAbsent: number;
  totalLeave: number;
  totalHolidays: number;
  totalWorkHours: string; // Formatted as Xh Ym
}

// --- UTILITY ---
// const fetchApi = async (url: string) => {
//   const token = localStorage.getItem("token");
//   if (!token) throw new Error("Authentication token not found.");
//   const headers = { Authorization: `Bearer ${token}` };
//   const response = await fetch(`${API_BASE_URL}${url}`, {
//     headers,
//     cache: "no-store",
//   });
//   if (!response.ok) {
//     const errorData = await response.json();
//     throw new Error(errorData.message || `API Error: ${response.statusText}`);
//   }
//   try {
//     return await response.json();
//   } catch (e) {
//     if (response.ok) return null; // Handle empty success response
//     throw new Error(`API Error: ${response.statusText}`);
//   }
// };

// --- UTILITY ---
const fetchApi = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Authentication token not found.");

  // Merge default headers with any custom headers
  const headers = {
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };

  // Build the full request options
  const config: RequestInit = {
    ...options, // This will include method: 'PATCH', body, etc.
    headers,
    cache: "no-store",
  };

  const response = await fetch(`${API_BASE_URL}${url}`, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})); // Handle empty error responses
    throw new Error(errorData.message || `API Error: ${response.statusText}`);
  }

  // Handle successful but empty responses (like a PATCH)
  if (response.status === 200 || response.status === 204) {
    try {
      return await response.json();
    } catch (e) {
      // This is OK, it just means no JSON body was returned
      return null;
    }
  }

  try {
    return await response.json();
  } catch (e) {
    if (response.ok) return null;
    throw new Error(`API Error: ${response.statusText}`);
  }
};

// Format Date object to YYYY-MM-DD for input value
const formatDateForInput = (date: Date): string =>
  date.toISOString().split("T")[0];

// Format date string (YYYY-MM-DD or ISO) to DD-MM-YYYY for display
const formatDateForDisplay = (
  dateString: string | null | undefined
): string => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    // Use UTC methods to avoid timezone shifting the date itself
    const utcDate = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
    );
    const day = utcDate.getUTCDate().toString().padStart(2, "0");
    const month = (utcDate.getUTCMonth() + 1).toString().padStart(2, "0");
    const year = utcDate.getUTCFullYear();
    // Check if the parsed date is valid before formatting
    if (isNaN(year) || isNaN(month) || isNaN(day)) return "Invalid Date";
    return `${day}-${month}-${year}`;
  } catch (e) {
    return "Invalid Date";
  }
};

// Format ISO date string to locale time (e.g., 09:30 AM)
const formatTime = (dateTime: string | null) => {
  if (!dateTime) return "---";
  try {
    // Use local time for display
    return new Date(dateTime).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch (e) {
    return "Invalid Time";
  }
};

// Format minutes into "Xh Ym" string, handling 0 values correctly
const minutesToHoursMinutes = (minutes: number | null | undefined): string => {
  if (minutes === null || typeof minutes === "undefined" || isNaN(minutes)) {
    return "---"; // Indicate invalid input
  }
  if (minutes < 0) minutes = 0; // Prevent negative display

  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60); // Round minutes

  if (h === 0 && m === 0 && minutes > 0) return "< 1m"; // Handle very small durations
  if (h === 0 && m === 0) return "0m"; // Explicitly show 0m if input was 0

  let result = "";
  if (h > 0) result += `${h}h `;
  // Only show minutes if they are > 0 OR if hours are 0 (e.g., 0h 30m)
  if (m > 0 || h === 0) result += `${m}m`;
  return result.trim();
};

// Formats a date string or Date object for a datetime-local input
const formatToISOLocal = (isoString: string | null): string => {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    // Adjust for local timezone offset
    const tzoffset = date.getTimezoneOffset() * 60000; //offset in milliseconds
    const localISOTime = new Date(date.getTime() - tzoffset)
      .toISOString()
      .slice(0, 16);
    return localISOTime;
  } catch {
    return "";
  }
};

// --- HELPER for row styling ---
const getStatusBadge = (status: ReportRow["status"]) => {
  // (Keep the existing getStatusBadge function as it was)
  switch (status) {
    case "Present":
      return (
        <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full flex items-center gap-1">
          <Check className="w-3 h-3" /> {status}
        </span>
      );
    case "Absent":
      return (
        <span className="px-2 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-full flex items-center gap-1">
          <X className="w-3 h-3" /> {status}
        </span>
      );
    case "On Leave":
      return (
        <span className="px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full flex items-center gap-1">
          <Coffee className="w-3 h-3" /> {status}
        </span>
      );
    case "Holiday":
    case "Sunday Holiday":
      return (
        <span className="px-2 py-1 text-xs font-medium text-purple-800 bg-purple-100 rounded-full flex items-center gap-1">
          <Moon className="w-3 h-3" /> {status}
        </span>
      );
    default:
      return (
        <span className="px-2 py-1 text-xs font-medium text-gray-800 bg-gray-100 rounded-full">
          {status}
        </span>
      );
  }
};

// --- Summary Card Component ---
const SummaryCard: React.FC<{
  title: string;
  value: string | number | React.ReactNode;
  icon: React.ElementType;
  color: string;
}> = ({ title, value, icon: Icon, color }) => (
  // (Keep the existing SummaryCard component as it was)
  <div className="flex-1 p-5 bg-white rounded-xl shadow-lg border border-gray-200 flex items-center gap-4 min-w-[200px]">
    <div className={`p-3 rounded-full ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

// --- NEW: User Details Card Component ---
const UserDetailsCard: React.FC<{
  user: UserDetails | null;
  isLoading: boolean;
}> = ({ user, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 mb-8 min-h-[150px] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
        <span className="ml-2 text-gray-500">Loading User Details...</span>
      </div>
    );
  }
  if (!user) {
    // Optional: Show an error state if user couldn't be loaded
    return (
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-red-200 mb-8 min-h-[150px] flex items-center justify-center">
        <AlertTriangle className="w-6 h-6 text-red-500" />
        <span className="ml-2 text-red-700">Could not load user details.</span>
      </div>
    );
  }

  const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({
    label,
    value,
  }) => (
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
        {label}
      </p>
      <p className="text-sm font-semibold text-gray-800">{value || "N/A"}</p>
    </div>
  );

  // const formatExpectedTime = (
  //   timeString: string | null | undefined
  // ): string => {
  //   if (!timeString) return "N/A";
  //   // If backend sends HH:MM:SS, create a dummy date to parse
  //   if (timeString.match(/^\d{2}:\d{2}:\d{2}$/)) {
  //     return formatTime(`1970-01-01T${timeString}Z`); // Treat as UTC time part
  //   }
  //   return formatTime(timeString); // Assume it's already a full date string
  // };

  const formatExpectedTime = (
    timeString: string | null | undefined
  ): string => {
    if (!timeString) return "N/A";
    try {
      // timeString is "1970-01-01T23:00:06.000Z"
      const date = new Date(timeString);
      // We MUST use UTC methods to get the time as it was sent
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "UTC", // <-- This forces it to ignore your local timezone
      });
    } catch (e) {
      return "Invalid Time";
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 mb-8">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
        <User className="w-5 h-5 mr-2 text-indigo-500" />
        User Basic Details
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <DetailItem label="Name" value={user.name} />
        <DetailItem label="Staff ID" value={user.staffId} />
        <DetailItem label="Email" value={user.email} />
        <DetailItem label="Phone" value={user.phone} />
        <DetailItem label="Position" value={user.position} />
        <DetailItem label="Role" value={user.role} />
        <DetailItem label="Branch" value={user.branch} />
        <DetailItem
          label="Status"
          value={
            user.status
              ? user.status.charAt(0).toUpperCase() + user.status.slice(1)
              : "N/A"
          }
        />
        <DetailItem label="Gender" value={user.gender} />
        <DetailItem label="Emirates ID" value={user.emiratesId} />
        <DetailItem
          label="Joined On"
          value={formatDateForDisplay(user.createdAt)}
        />
        <DetailItem
          label="Last Login"
          value={
            user.lastLogin
              ? formatTime(user.lastLogin) +
                " (" +
                formatDateForDisplay(user.lastLogin) +
                ")"
              : "N/A"
          }
        />
        {/* --- ADD THESE NEW ITEMS --- */}
        <DetailItem
          label="Expected Check-In"
          value={formatExpectedTime(user.ExpectedCheckIn)}
        />
        <DetailItem
          label="Expected Check-Out"
          value={formatExpectedTime(user.ExpectedCheckOut)}
        />
        <DetailItem
          label="Expected Break-In"
          value={formatExpectedTime(user.ExpectedBreakIn)}
        />
        <DetailItem
          label="Expected Break-Out"
          value={formatExpectedTime(user.ExpectedBreakOut)}
        />
        {/* --- END ADDED ITEMS --- */}
      </div>
    </div>
  );
};

// --- Daily Detail Modal Component (Updated with Late/OT) ---
const DailyDetailModal: React.FC<{
  day: ReportRow;
  onClose: () => void;
  onRefresh: () => void;
}> = ({ day, onClose, onRefresh }) => {
  const {
    date,
    status,
    checkIn,
    checkOut,
    breakIn,
    breakOut,
    totalWorkMinutes,
    totalBreakMinutes,
    lateMinutes, // Receive lateMinutes
    overtimeMinutes, // Receive overtimeMinutes
    selfiePhotoUrl,
  } = day;

  const [editingField, setEditingField] = useState<
    "checkIn" | "checkOut" | null
  >(null);
  const [editTime, setEditTime] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // Calculate values for the graph
  const overtimeGraphMinutes = Math.max(0, overtimeMinutes); // Use direct overtime value
  // Adjust regular work: Total work MINUS overtime (if any)
  const regularWorkGraphMinutes = Math.max(
    0,
    totalWorkMinutes - overtimeGraphMinutes
  );

  const graphData = [
    { name: "Work", minutes: regularWorkGraphMinutes, fill: "#3b82f6" }, // Blue
    { name: "Break", minutes: totalBreakMinutes, fill: "#f59e0b" }, // Amber
    { name: "Overtime", minutes: overtimeGraphMinutes, fill: "#10b981" }, // Emerald
  ].filter((d) => d.minutes > 0); // Only show bars with > 0 minutes

  const DetailRow: React.FC<{
    label: string;
    value: React.ReactNode;
    color?: string;
  }> = ({ label, value, color = "text-gray-900" }) => (
    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 items-center">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd
        className={`mt-1 text-sm sm:mt-0 sm:col-span-2 font-semibold ${color}`}
      >
        {value}
      </dd>
    </div>
  );

  // Format Late/OT status strings
  const lateStatus = lateMinutes > 0 ? `${lateMinutes}m Late` : null;
  const overtimeStatus =
    overtimeMinutes > 0 ? `${minutesToHoursMinutes(overtimeMinutes)} OT` : null;

  // ... (after const overtimeStatus)

  // --- NEW EDIT HANDLERS ---
  const handleEditCheckIn = async () => {
    if (!day.attendanceId) {
      showError("Cannot edit: Attendance ID is missing.");
      return;
    }

    const defaultTime = formatToISOLocal(day.checkIn);
    const newTimeStr = window.prompt(
      "Enter new Check-In time (YYYY-MM-DDTHH:MM):",
      defaultTime
    );

    if (!newTimeStr) return; // User cancelled

    const newTimeDate = new Date(newTimeStr);
    if (isNaN(newTimeDate.getTime())) {
      return showError("Invalid date format.");
    }

    try {
      await fetchApi(`/attendance/record/${day.attendanceId}/check-in`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newCheckInTime: newTimeDate.toISOString() }),
      });
      showSuccess("Check-In time updated!");
      onRefresh(); // Refresh the report
      onClose(); // Close the modal
    } catch (err: any) {
      showError(err.message || "Failed to update time.");
    }
  };

  const handleEditCheckOut = async () => {
    if (!day.attendanceId) {
      showError("Cannot edit: Attendance ID is missing.");
      return;
    }

    const defaultTime = formatToISOLocal(day.checkOut);
    const newTimeStr = window.prompt(
      "Enter new Check-Out time (YYYY-MM-DDTHH:MM):",
      defaultTime
    );

    if (!newTimeStr) return; // User cancelled

    const newTimeDate = new Date(newTimeStr);
    if (isNaN(newTimeDate.getTime())) {
      return showError("Invalid date format.");
    }

    try {
      await fetchApi(`/attendance/record/${day.attendanceId}/check-out`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newCheckOutTime: newTimeDate.toISOString() }),
      });
      showSuccess("Check-Out time updated!");
      onRefresh(); // Refresh the report
      onClose(); // Close the modal
    } catch (err: any) {
      showError(err.message || "Failed to update time.");
    }
  };
  // --- END NEW EDIT HANDLERS ---

  // --- NEW EDIT HANDLERS ---

  // Function to START editing
  const startEdit = (field: "checkIn" | "checkOut") => {
    setEditingField(field);
    // Use the correct time for the field being edited
    const timeToEdit = field === "checkIn" ? day.checkIn : day.checkOut;
    setEditTime(formatToISOLocal(timeToEdit)); // formatToISOLocal is already in your file
  };

  // Function to CANCEL editing
  const cancelEdit = () => {
    setEditingField(null);
    setEditTime("");
  };

  // Function to SAVE the edit
  const saveEdit = async () => {
    if (!editingField || !day.attendanceId) {
      showError("Cannot save: Unknown error.");
      return;
    }

    const newTimeDate = new Date(editTime);
    if (isNaN(newTimeDate.getTime())) {
      return showError("Invalid date format.");
    }

    // Determine which API endpoint and body to use
    const endpoint =
      editingField === "checkIn"
        ? `/attendance/record/${day.attendanceId}/check-in`
        : `/attendance/record/${day.attendanceId}/check-out`;

    const body =
      editingField === "checkIn"
        ? { newCheckInTime: newTimeDate.toISOString() }
        : { newCheckOutTime: newTimeDate.toISOString() };

    setIsSaving(true);
    try {
      await fetchApi(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      showSuccess(`Time updated successfully!`);
      onRefresh(); // Refresh the report
      onClose(); // Close the modal
    } catch (err: any) {
      showError(err.message || "Failed to update time.");
    } finally {
      setIsSaving(false);
    }
  };
  // --- END NEW EDIT HANDLERS ---

  return (
    // Modal backdrop
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 transition-opacity duration-300 animate-fade-in"
      onClick={onClose}
    >
      {/* Modal content */}
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col transform transition-all duration-300 scale-95 opacity-0 animate-modal-scale-in"
        onClick={(e) => e.stopPropagation()}
        style={{ animationFillMode: "forwards" }}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between p-5 border-b bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Daily Detail</h2>
            <p className="text-sm text-gray-600">
              {formatDateForDisplay(date)}
            </p>
            {/* Display Late/OT Badges */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {lateStatus && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  <AlertCircle className="w-3 h-3" /> {lateStatus}
                </span>
              )}
              {overtimeStatus && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  <Clock className="w-3 h-3" /> {overtimeStatus}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-600 rounded-full transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto">
          {status === "Present" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Side: Stats */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-indigo-500" />
                  Summary
                </h3>
                <dl className="divide-y divide-gray-200 border rounded-lg overflow-hidden bg-white">
                  <DetailRow
                    label="Status"
                    value={status}
                    color="text-green-600 font-bold"
                  />
                  <DetailRow
                    label="Total Work"
                    value={minutesToHoursMinutes(totalWorkMinutes)}
                    color="text-blue-600 font-bold"
                  />
                  <DetailRow
                    label="Total Break"
                    value={minutesToHoursMinutes(totalBreakMinutes)}
                    color="text-amber-600 font-bold"
                  />
                  {/* Conditionally show Late/OT */}
                  {lateMinutes > 0 && (
                    <DetailRow
                      label="Late By"
                      value={`${lateMinutes} min`}
                      color="text-orange-600 font-bold"
                    />
                  )}
                  {overtimeMinutes > 0 && (
                    <DetailRow
                      label="Overtime"
                      value={minutesToHoursMinutes(overtimeMinutes)}
                      color="text-purple-600 font-bold"
                    />
                  )}
                </dl>

                <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-2 flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-indigo-500" />
                  Timestamps
                </h3>

                <dl className="divide-y divide-gray-200 border rounded-lg overflow-hidden bg-white">
                  {/* --- Check In Row --- */}
                  <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 items-center px-4">
                    <dt className="text-sm font-medium text-gray-500">
                      Check In
                    </dt>
                    <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2 font-semibold">
                      {editingField === "checkIn" ? (
                        // EDIT MODE
                        <div className="flex gap-2">
                          <input
                            type="datetime-local"
                            value={editTime}
                            onChange={(e) => setEditTime(e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                            autoFocus
                          />
                        </div>
                      ) : (
                        // DISPLAY MODE
                        <div className="flex items-center justify-between">
                          <span>{formatTime(checkIn)}</span>
                          <button
                            onClick={() => startEdit("checkIn")}
                            className="p-1 text-xs text-blue-600 hover:bg-blue-100 rounded"
                            title="Edit Check-In Time"
                          >
                            <Briefcase className="w-3 h-3" />{" "}
                            {/* Replace with Edit icon if you have it */}
                          </button>
                        </div>
                      )}
                    </dd>
                  </div>

                  {/* --- Break In Row (No Edit) --- */}
                  <DetailRow label="Break In" value={formatTime(breakIn)} />

                  {/* --- Break Out Row (No Edit) --- */}
                  <DetailRow label="Break Out" value={formatTime(breakOut)} />

                  {/* --- Check Out Row --- */}
                  <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 items-center px-4">
                    <dt className="text-sm font-medium text-gray-500">
                      Check Out
                    </dt>
                    <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2 font-semibold">
                      {editingField === "checkOut" ? (
                        // EDIT MODE
                        <div className="flex gap-2">
                          <input
                            type="datetime-local"
                            value={editTime}
                            onChange={(e) => setEditTime(e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                            autoFocus
                          />
                        </div>
                      ) : (
                        // DISPLAY MODE
                        <div className="flex items-center justify-between">
                          <span>{formatTime(checkOut)}</span>
                          <button
                            onClick={() => startEdit("checkOut")}
                            className="p-1 text-xs text-blue-600 hover:bg-blue-100 rounded"
                            title="Edit Check-Out Time"
                          >
                            <Briefcase className="w-3 h-3" />{" "}
                            {/* Replace with Edit icon if you have it */}
                          </button>
                        </div>
                      )}
                    </dd>
                  </div>
                </dl>

                {/* --- NEW Save/Cancel Buttons --- */}
                {editingField && (
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={cancelEdit}
                      className="flex-1 py-2 px-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveEdit}
                      disabled={isSaving}
                      className="flex-1 py-2 px-3 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                      ) : (
                        "Save"
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Right Side: Graph */}
              <div className="min-h-[300px] flex flex-col">
                <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                  <PieChart className="w-4 h-4 mr-2 text-indigo-500" />
                  Time Visualization
                </h3>
                <div className="flex-grow">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={graphData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis
                        type="number"
                        tickFormatter={(value) => minutesToHoursMinutes(value)}
                      />
                      <YAxis dataKey="name" type="category" width={60} />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          minutesToHoursMinutes(value),
                          name,
                        ]}
                        cursor={{ fill: "rgba(230, 230, 230, 0.5)" }}
                      />
                      <Legend />
                      <Bar dataKey="minutes" name="Duration" barSize={40}>
                        {graphData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              {/* === NEW Selfie Section === */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                  <User className="w-4 h-4 mr-2 text-indigo-500" />
                  Check-in Selfie
                </h3>
                <div className="w-full aspect-square bg-gray-100 border border-gray-200 rounded-lg overflow-hidden flex items-center justify-center">
                  {selfiePhotoUrl ? (
                    <img
                      src={selfiePhotoUrl}
                      alt="Check-in Selfie"
                      className="w-full h-full object-cover"
                      // Add error handling
                      onError={(e) =>
                        (e.currentTarget.src =
                          "https://placehold.co/300x300/EFEFEF/CCCCCC?text=No+Image")
                      }
                    />
                  ) : (
                    <span className="text-gray-400 text-sm">
                      No Selfie Available
                    </span>
                  )}
                </div>
              </div>
              {/* === END Selfie Section === */}
            </div>
          ) : (
            // Fallback for non-present days
            <div className="text-center py-10">
              <h3 className="text-lg font-semibold text-gray-800">
                Day Summary
              </h3>
              <p className="text-gray-600 mt-2">The status for this day was:</p>
              <div className="mt-4 inline-block">{getStatusBadge(status)}</div>
              <p className="text-gray-500 text-sm mt-4">
                No timing details are available.
              </p>
            </div>
          )}
        </div>
        <style jsx>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          @keyframes scaleIn {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          .animate-fade-in {
            animation: fadeIn 0.3s ease-out forwards;
          }
          .animate-modal-scale-in {
            animation: scaleIn 0.3s ease-out forwards;
          }
        `}</style>
      </div>
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
const UserAttendanceReport = () => {
  const params = useParams();
  const userId = params.userId as string;
  const today = formatDateForInput(new Date()); // Get today in YYYY-MM-DD

  const [reportData, setReportData] = useState<ReportRow[]>([]);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<ReportRow | null>(null); // For modal
  const [dateRange, setDateRange] = useState({
    startDate: formatDateForInput(
      new Date(new Date().setDate(new Date().getDate() - 30))
    ), // Default to last 30 days
    endDate: today,
  });

  // Fetch user details
  useEffect(() => {
    if (!userId) return;
    let isMounted = true; // Prevent state update on unmounted component
    const fetchUser = async () => {
      try {
        const data = await fetchApi(`/users/minimal?id=${userId}`); // Assuming this endpoint can filter by single userId
        const user = (data?.items || []).find(
          (u: UserDetails) => u.id === userId
        );
        if (isMounted) {
          setUserDetails(user || { id: userId, name: "Employee" }); // Fallback if not found
        }
      } catch (err) {
        console.warn("Could not fetch user name:", err);
        if (isMounted) setUserDetails({ id: userId, name: "Employee" });
      }
    };
    fetchUser();
    return () => {
      isMounted = false;
    }; // Cleanup
  }, [userId]);

  // Fetch report data
  const fetchReport = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    let isMounted = true;
    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
      const data = await fetchApi(
        `/attendance/report/${userId}?${params.toString()}`
      );
      if (isMounted) setReportData(data || []);
    } catch (err: any) {
      console.error("Failed to fetch report:", err);
      if (isMounted) setError(err.message || "Failed to fetch report.");
      if (isMounted) setReportData([]); // Clear data on error
    } finally {
      if (isMounted) setIsLoading(false);
    }
    return () => {
      isMounted = false;
    };
  }, [userId, dateRange]);

  // Handler for date input changes
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Prevent selecting future dates
    if (value > today) return;

    setDateRange((prev) => {
      const newState = { ...prev, [name]: value };
      // Basic validation: ensure end date is not before start date
      if (name === "startDate" && value > newState.endDate)
        newState.endDate = value;
      if (name === "endDate" && value < newState.startDate)
        newState.startDate = value;
      return newState;
    });
  };

  // Handler for search button click
  const handleSearch = () => {
    fetchReport(); // Re-fetch data when search is clicked
  };

  // Initial data fetch and re-fetch on date range change (implicitly via fetchReport dependency)
  useEffect(() => {
    fetchReport();
  }, [fetchReport]); // fetchReport dependency includes dateRange

  // Calculate Summary Data using useMemo
  const summary = useMemo((): ReportSummary => {
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLeave = 0;
    let totalHolidays = 0;
    let totalMinutes = 0;

    for (const row of reportData) {
      switch (row.status) {
        case "Present":
          totalPresent++;
          totalMinutes += row.totalWorkMinutes || 0; // Use || 0 as fallback
          break;
        case "Absent":
          totalAbsent++;
          break;
        case "On Leave":
          totalLeave++;
          break;
        case "Holiday":
        case "Sunday Holiday":
          totalHolidays++;
          break;
      }
    }
    return {
      totalPresent,
      totalAbsent,
      totalLeave,
      totalHolidays,
      totalWorkHours: minutesToHoursMinutes(totalMinutes), // Format total hours
    };
  }, [reportData]);

  // Handler to open the modal
  const handleRowClick = (dayData: ReportRow) => {
    setSelectedDay(dayData);
  };

  return (
    <div className="p-6 md:p-10 bg-gray-50 min-h-screen">
      {/* Header */}
      <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-2">
        Attendance Report
      </h1>
      <h2 className="text-xl lg:text-2xl font-medium text-indigo-600 mb-8 flex items-center">
        <User className="w-5 h-5 lg:w-6 lg:h-6 mr-2 flex-shrink-0" />
        <span className="truncate">
          {userDetails ? (
            userDetails.name
          ) : (
            <Loader2 className="w-5 h-5 animate-spin" />
          )}
        </span>
        <br />
        <span className="truncate">
          {userDetails ? (
            userDetails.staffId
          ) : (
            <Loader2 className="w-5 h-5 animate-spin" />
          )}
        </span>
      </h2>

      <UserDetailsCard user={userDetails} isLoading={!userDetails && !error} />

      {/* Date Filter Bar */}
      <div className="bg-white p-5 rounded-2xl shadow-lg mb-8 border border-gray-200 flex flex-col sm:flex-row flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="date"
            name="startDate"
            value={dateRange.startDate}
            onChange={handleDateChange}
            max={today} // Prevent future start date
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            type="date"
            name="endDate"
            value={dateRange.endDate}
            onChange={handleDateChange}
            max={today} // Prevent future end date
            min={dateRange.startDate} // Prevent end date before start date
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={isLoading}
          className="w-full sm:w-auto px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Search className="w-4 h-4 mr-2" />
          )}
          Search
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          title="Total Present"
          value={
            isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-green-500" />
            ) : (
              summary.totalPresent
            )
          }
          icon={Check}
          color="bg-green-500"
        />
        <SummaryCard
          title="Total Absent"
          value={
            isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-red-500" />
            ) : (
              summary.totalAbsent
            )
          }
          icon={X}
          color="bg-red-500"
        />
        <SummaryCard
          title="Total On Leave"
          value={
            isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            ) : (
              summary.totalLeave
            )
          }
          icon={Coffee}
          color="bg-blue-500"
        />
        <SummaryCard
          title="Total Work Hours"
          value={
            isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
            ) : (
              summary.totalWorkHours
            )
          }
          icon={Clock}
          color="bg-indigo-500"
        />
      </div>

      {/* Report Table */}
      <div className="bg-white shadow-2xl rounded-2xl overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Check In
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Check Out
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Total Hours
                </th>
                {/* Updated Column Header */}
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-indigo-600">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
                    <p className="text-sm">Generating report...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-gray-500">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-red-500" />
                    <p className="text-red-700 font-medium">Error: {error}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Could not load attendance data.
                    </p>
                  </td>
                </tr>
              ) : !reportData || reportData.length === 0 ? ( // Added !reportData check
                <tr>
                  <td colSpan={6} className="text-center py-16 text-gray-400">
                    {/* <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-yellow-500" /> */}
                    <p>No data found for this date range.</p>
                  </td>
                </tr>
              ) : (
                reportData.map((row) => (
                  <tr
                    key={row.date} // Use date as key if AttendanceId isn't available/unique per day
                    className={`${
                      row.status === "Absent"
                        ? "bg-red-50 hover:bg-red-100"
                        : "hover:bg-gray-50"
                    } transition cursor-pointer`}
                    onClick={() => handleRowClick(row)} // Open modal on click
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatDateForDisplay(row.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(row.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatTime(row.checkIn)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatTime(row.checkOut)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-600">
                      {/* Use minutesToHoursMinutes for consistency */}
                      {row.status === "Present"
                        ? minutesToHoursMinutes(row.totalWorkMinutes)
                        : "---"}
                    </td>
                    {/* Updated TD for Notes */}
                    <td className="px-6 py-4 whitespace-nowrap text-xs">
                      <div className="flex flex-col gap-1 items-start">
                        {row.lateMinutes > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 font-medium">
                            <AlertCircle className="w-3 h-3" /> Late:{" "}
                            {row.lateMinutes}m
                          </span>
                        )}
                        {row.overtimeMinutes > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-medium">
                            <Clock className="w-3 h-3" /> OT:{" "}
                            {minutesToHoursMinutes(row.overtimeMinutes)}
                          </span>
                        )}
                        {/* Show dash only if BOTH are zero/null AND status is Present */}
                        {row.status === "Present" &&
                          row.lateMinutes <= 0 &&
                          row.overtimeMinutes <= 0 && <span>-</span>}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Render the Modal */}
      {selectedDay && (
        <DailyDetailModal
          day={selectedDay}
          onClose={() => setSelectedDay(null)}
          onRefresh={fetchReport}
        />
      )}
    </div>
  );
};

export default UserAttendanceReport;

// //--------------------------------------------------------------------------------

// "use client";
// import React, { useState, useEffect, useCallback, useMemo } from "react";
// import { useParams } from "next/navigation";
// import {
//   Loader2,
//   AlertTriangle,
//   Calendar,
//   Search,
//   User,
//   Check,
//   X,
//   Coffee,
//   Moon,
//   TrendingUp,
//   Clock,
//   Briefcase,
//   PieChart,
// } from "lucide-react";
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   Tooltip,
//   ResponsiveContainer,
//   Legend,
//   Cell,
//   CartesianGrid,
// } from "recharts";

// // --- CONFIGURATION ---
// const API_BASE_URL = "http://localhost:5050"; // Use your actual API base URL
// const EXPECTED_WORK_MINUTES = 480; // 8 hours. Used for Overtime calc in graph

// // --- TYPES ---
// interface ReportRow {
//   date: string;
//   status: "Present" | "Absent" | "Holiday" | "Sunday Holiday" | "On Leave";
//   checkIn: string | null;
//   checkOut: string | null;
//   breakIn: string | null;
//   breakOut: string | null;
//   // --- CORRECTED CASE ---
//   totalWorkMinutes: number;
//   totalBreakMinutes: number;
// }

// interface UserDetails {
//   id: string;
//   name: string;
// }

// interface ReportSummary {
//   totalPresent: number;
//   totalAbsent: number;
//   totalLeave: number;
//   totalHolidays: number;
//   totalWorkHours: string;
// }

// // --- UTILITY ---
// const fetchApi = async (url: string) => {
//   const token = localStorage.getItem("token");
//   if (!token) throw new Error("Authentication token not found.");
//   const headers = { Authorization: `Bearer ${token}` };
//   const response = await fetch(`${API_BASE_URL}${url}`, { headers });
//   if (!response.ok) {
//     const errorData = await response.json();
//     throw new Error(errorData.message || `API Error: ${response.statusText}`);
//   }
//   return response.json();
// };

// const formatDate = (date: Date) => date.toISOString().split("T")[0];

// const formatTime = (dateTime: string | null) => {
//   if (!dateTime) return "---";
//   try {
//     return new Date(dateTime).toLocaleTimeString("en-US", {
//       hour: "2-digit",
//       minute: "2-digit",
//       hour12: true,
//     });
//   } catch (e) {
//     return "Invalid Time";
//   }
// };

// // Helper to format minutes to "Hh M_m" with safety check
// const minutesToHours = (minutes: number | null | undefined): string => {
//   // console.log("minutesToHours received:", minutes, typeof minutes); // Keep for debugging if needed
//   if (minutes === null || typeof minutes === "undefined" || isNaN(minutes)) {
//     // console.warn("Invalid input to minutesToHours:", minutes);
//     return "---"; // Return dashes for invalid input
//   }
//   if (minutes < 0) minutes = 0; // Prevent negative durations
//   const h = Math.floor(minutes / 60);
//   const m = Math.round(minutes % 60); // Use round for potentially fractional minutes from DATEDIFF
//   return `${h}h ${m}m`;
// };

// // --- HELPER for row styling ---
// const getStatusBadge = (status: ReportRow["status"]) => {
//   switch (status) {
//     case "Present":
//       return (
//         <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full flex items-center gap-1">
//           <Check className="w-3 h-3" /> {status}
//         </span>
//       );
//     case "Absent":
//       return (
//         <span className="px-2 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-full flex items-center gap-1">
//           <X className="w-3 h-3" /> {status}
//         </span>
//       );
//     case "On Leave":
//       return (
//         <span className="px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full flex items-center gap-1">
//           <Coffee className="w-3 h-3" /> {status}
//         </span>
//       );
//     case "Holiday":
//     case "Sunday Holiday":
//       return (
//         <span className="px-2 py-1 text-xs font-medium text-purple-800 bg-purple-100 rounded-full flex items-center gap-1">
//           <Moon className="w-3 h-3" /> {status}
//         </span>
//       );
//     default:
//       return (
//         <span className="px-2 py-1 text-xs font-medium text-gray-800 bg-gray-100 rounded-full">
//           {status}
//         </span>
//       );
//   }
// };

// // --- Summary Card Component ---
// const SummaryCard: React.FC<{
//   title: string;
//   value: string | number | React.ReactNode;
//   icon: React.ElementType;
//   color: string;
// }> = ({ title, value, icon: Icon, color }) => (
//   <div className="flex-1 p-5 bg-white rounded-xl shadow-lg border border-gray-200 flex items-center gap-4 min-w-[200px]">
//     <div className={`p-3 rounded-full ${color}`}>
//       <Icon className="w-6 h-6 text-white" />
//     </div>
//     <div>
//       <p className="text-sm font-medium text-gray-500">{title}</p>
//       <p className="text-2xl font-bold text-gray-900">{value}</p>
//     </div>
//   </div>
// );

// // --- Daily Detail Modal Component ---
// const DailyDetailModal: React.FC<{ day: ReportRow; onClose: () => void }> = ({
//   day,
//   onClose,
// }) => {
//   const {
//     date,
//     status,
//     checkIn,
//     checkOut,
//     breakIn,
//     breakOut,
//     totalWorkMinutes, // Correct case
//     totalBreakMinutes, // Correct case
//   } = day;

//   // Calculate values for the graph
//   const overtimeMinutes = Math.max(0, totalWorkMinutes - EXPECTED_WORK_MINUTES);
//   const regularWorkMinutes = totalWorkMinutes - overtimeMinutes;

//   const graphData = [
//     { name: "Work", minutes: regularWorkMinutes, fill: "#3b82f6" }, // Blue
//     { name: "Break", minutes: totalBreakMinutes, fill: "#f59e0b" }, // Amber
//     { name: "Overtime", minutes: overtimeMinutes, fill: "#10b981" }, // Emerald
//   ].filter((d) => d.minutes > 0); // Only show bars with > 0 minutes

//   const DetailRow: React.FC<{
//     label: string;
//     value: string;
//     color?: string;
//   }> = ({ label, value, color = "text-gray-900" }) => (
//     <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 items-center">
//       <dt className="text-sm font-medium text-gray-500">{label}</dt>
//       <dd
//         className={`mt-1 text-sm sm:mt-0 sm:col-span-2 font-semibold ${color}`}
//       >
//         {value}
//       </dd>
//     </div>
//   );

//   return (
//     // Modal backdrop with close functionality
//     <div
//       className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 transition-opacity duration-300"
//       onClick={onClose}
//     >
//       {/* Modal content area, prevents closing when clicking inside */}
//       <div
//         className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col transform transition-all duration-300 scale-95 opacity-0 animate-modal-scale-in"
//         onClick={(e) => e.stopPropagation()}
//         style={{ animationFillMode: "forwards" }} // Keep final state of animation
//       >
//         {/* Modal Header */}
//         <div className="flex items-center justify-between p-5 border-b bg-gray-50">
//           <div>
//             <h2 className="text-xl font-bold text-gray-900">Daily Detail</h2>
//             <p className="text-sm text-gray-600">{date}</p>
//           </div>
//           <button
//             onClick={onClose}
//             className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition"
//             aria-label="Close modal"
//           >
//             <X className="w-5 h-5" />
//           </button>
//         </div>

//         {/* Modal Content */}
//         <div className="p-6 overflow-y-auto">
//           {status === "Present" ? (
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               {/* Left Side: Stats */}
//               <div>
//                 <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
//                   <Clock className="w-4 h-4 mr-2 text-indigo-500" />
//                   Summary
//                 </h3>
//                 <dl className="divide-y divide-gray-200 border rounded-lg overflow-hidden bg-white">
//                   <DetailRow
//                     label="Status"
//                     value={status}
//                     color="text-green-600 font-bold"
//                   />
//                   <DetailRow
//                     label="Total Work"
//                     value={minutesToHours(totalWorkMinutes)}
//                     color="text-blue-600 font-bold"
//                   />
//                   <DetailRow
//                     label="Total Break"
//                     value={minutesToHours(totalBreakMinutes)}
//                     color="text-amber-600 font-bold"
//                   />
//                   <DetailRow
//                     label="Overtime"
//                     value={minutesToHours(overtimeMinutes)}
//                     color="text-emerald-600 font-bold"
//                   />
//                 </dl>

//                 <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-2 flex items-center">
//                   <Calendar className="w-4 h-4 mr-2 text-indigo-500" />
//                   Timestamps
//                 </h3>
//                 <dl className="divide-y divide-gray-200 border rounded-lg overflow-hidden bg-white">
//                   <DetailRow label="Check In" value={formatTime(checkIn)} />
//                   <DetailRow label="Break In" value={formatTime(breakIn)} />
//                   <DetailRow label="Break Out" value={formatTime(breakOut)} />
//                   <DetailRow label="Check Out" value={formatTime(checkOut)} />
//                 </dl>
//               </div>

//               {/* Right Side: Graph */}
//               <div className="min-h-[300px] flex flex-col">
//                 <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
//                   <PieChart className="w-4 h-4 mr-2 text-indigo-500" />
//                   Time Visualization
//                 </h3>
//                 <div className="flex-grow">
//                   <ResponsiveContainer width="100%" height={300}>
//                     <BarChart
//                       data={graphData}
//                       layout="vertical"
//                       margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
//                     >
//                       <CartesianGrid strokeDasharray="3 3" horizontal={false} />
//                       <XAxis
//                         type="number"
//                         tickFormatter={(value) => minutesToHours(value)}
//                       />
//                       <YAxis dataKey="name" type="category" width={60} />
//                       <Tooltip
//                         formatter={(value: number, name: string) => [
//                           minutesToHours(value),
//                           name,
//                         ]}
//                         cursor={{ fill: "rgba(230, 230, 230, 0.5)" }}
//                       />
//                       <Legend />
//                       <Bar dataKey="minutes" name="Duration" barSize={40}>
//                         {graphData.map((entry, index) => (
//                           <Cell key={`cell-${index}`} fill={entry.fill} />
//                         ))}
//                       </Bar>
//                     </BarChart>
//                   </ResponsiveContainer>
//                 </div>
//               </div>
//             </div>
//           ) : (
//             // Fallback for non-present days
//             <div className="text-center py-10">
//               <h3 className="text-lg font-semibold text-gray-800">
//                 Day Summary
//               </h3>
//               <p className="text-gray-600 mt-2">The status for this day was:</p>
//               <div className="mt-4 inline-block">{getStatusBadge(status)}</div>
//               <p className="text-gray-500 text-sm mt-4">
//                 No timing details are available.
//               </p>
//             </div>
//           )}
//         </div>
//         {/* Optional: Add a subtle animation keyframe definition if not globally available */}
//         <style jsx>{`
//           @keyframes modal-scale-in {
//             from {
//               opacity: 0;
//               transform: scale(0.95);
//             }
//             to {
//               opacity: 1;
//               transform: scale(1);
//             }
//           }
//           .animate-modal-scale-in {
//             animation: modal-scale-in 0.2s ease-out forwards;
//           }
//         `}</style>
//       </div>
//     </div>
//   );
// };

// // --- MAIN PAGE COMPONENT ---
// const UserAttendanceReport = () => {
//   const params = useParams();
//   const userId = params.userId as string;
//   const today = new Date().toISOString().split("T")[0];

//   const [reportData, setReportData] = useState<ReportRow[]>([]);
//   const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [selectedDay, setSelectedDay] = useState<ReportRow | null>(null);
//   const [dateRange, setDateRange] = useState({
//     startDate: formatDate(
//       new Date(new Date().setDate(new Date().getDate() - 30))
//     ),
//     endDate: today,
//   });

//   // Fetch user details (name)
//   useEffect(() => {
//     if (!userId) return;
//     const fetchUser = async () => {
//       try {
//         // Fetching all and finding one. Consider a specific GET /users/:id endpoint.
//         const data = await fetchApi(`/users/minimal?userId=${userId}`);
//         const user = (data.items || []).find(
//           (u: UserDetails) => u.id === userId
//         );
//         if (user) {
//           setUserDetails(user);
//         } else {
//           setUserDetails({ id: userId, name: "Employee" }); // Fallback
//         }
//       } catch (err) {
//         console.warn("Could not fetch user name");
//         setUserDetails({ id: userId, name: "Employee" }); // Set fallback
//       }
//     };
//     fetchUser();
//   }, [userId]);

//   // Fetch report data
//   const fetchReport = useCallback(async () => {
//     if (!userId) return;
//     setIsLoading(true);
//     setError(null);
//     try {
//       const params = new URLSearchParams({
//         startDate: dateRange.startDate,
//         endDate: dateRange.endDate,
//       });
//       const data = await fetchApi(
//         `/attendance/report/${userId}?${params.toString()}`
//       );
//       setReportData(data || []);
//     } catch (err: any) {
//       setError(err.message || "Failed to fetch report.");
//       setReportData([]);
//     } finally {
//       setIsLoading(false);
//     }
//   }, [userId, dateRange]);

//   const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value } = e.target;
//     if (value > today) return;

//     setDateRange((prev) => {
//       const newState = { ...prev, [name]: value };
//       if (name === "startDate" && value > newState.endDate)
//         newState.endDate = value;
//       if (name === "endDate" && value < newState.startDate)
//         newState.startDate = value;
//       return newState;
//     });
//   };

//   const handleSearch = () => {
//     fetchReport();
//   };

//   useEffect(() => {
//     fetchReport();
//   }, [fetchReport]);

//   // Calculate Summary Data
//   const summary = useMemo((): ReportSummary => {
//     let totalPresent = 0;
//     let totalAbsent = 0;
//     let totalLeave = 0;
//     let totalHolidays = 0; // Includes Sunday Holiday
//     let totalMinutes = 0;

//     for (const row of reportData) {
//       switch (row.status) {
//         case "Present":
//           totalPresent++;
//           totalMinutes += row.totalWorkMinutes; // Correct case
//           break;
//         case "Absent":
//           totalAbsent++;
//           break;
//         case "On Leave":
//           totalLeave++;
//           break;
//         case "Holiday":
//         case "Sunday Holiday":
//           totalHolidays++;
//           break;
//       }
//     }
//     return {
//       totalPresent,
//       totalAbsent,
//       totalLeave,
//       totalHolidays,
//       totalWorkHours: minutesToHours(totalMinutes),
//     };
//   }, [reportData]);

//   return (
//     <div className="p-6 md:p-10 bg-gray-50 min-h-screen">
//       <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
//         Attendance Report
//       </h1>
//       <h2 className="text-2xl font-medium text-indigo-600 mb-8 flex items-center">
//         <User className="w-6 h-6 mr-2" />
//         {userDetails ? (
//           userDetails.name
//         ) : (
//           <Loader2 className="w-5 h-5 animate-spin" />
//         )}
//       </h2>

//       {/* Date Filter Bar */}
//       <div className="bg-white p-5 rounded-2xl shadow-lg mb-8 border border-gray-200 flex flex-wrap gap-4 items-end">
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">
//             Start Date
//           </label>
//           <input
//             type="date"
//             name="startDate"
//             value={dateRange.startDate}
//             onChange={handleDateChange}
//             max={today}
//             className="px-3 py-2 border border-gray-300 rounded-lg"
//           />
//         </div>
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">
//             End Date
//           </label>
//           <input
//             type="date"
//             name="endDate"
//             value={dateRange.endDate}
//             onChange={handleDateChange}
//             max={today}
//             className="px-3 py-2 border border-gray-300 rounded-lg"
//           />
//         </div>
//         <button
//           onClick={handleSearch}
//           disabled={isLoading}
//           className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium flex items-center disabled:opacity-50"
//         >
//           {isLoading ? (
//             <Loader2 className="w-5 h-5 animate-spin mr-2" />
//           ) : (
//             <Search className="w-5 h-5 mr-2" />
//           )}
//           Search
//         </button>
//       </div>

//       {/* Summary Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//         <SummaryCard
//           title="Total Present"
//           value={
//             isLoading ? (
//               <Loader2 className="w-5 h-5 animate-spin text-green-500" />
//             ) : (
//               summary.totalPresent
//             )
//           }
//           icon={Check}
//           color="bg-green-500"
//         />
//         <SummaryCard
//           title="Total Absent"
//           value={
//             isLoading ? (
//               <Loader2 className="w-5 h-5 animate-spin text-red-500" />
//             ) : (
//               summary.totalAbsent
//             )
//           }
//           icon={X}
//           color="bg-red-500"
//         />
//         <SummaryCard
//           title="Total On Leave"
//           value={
//             isLoading ? (
//               <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
//             ) : (
//               summary.totalLeave
//             )
//           }
//           icon={Coffee}
//           color="bg-blue-500"
//         />
//         <SummaryCard
//           title="Total Work Hours"
//           value={
//             isLoading ? (
//               <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
//             ) : (
//               summary.totalWorkHours
//             )
//           }
//           icon={Clock}
//           color="bg-indigo-500"
//         />
//       </div>

//       {/* Report Table */}
//       <div className="bg-white shadow-2xl rounded-2xl overflow-hidden border border-gray-200">
//         <div className="overflow-x-auto">
//           <table className="min-w-full divide-y divide-gray-200">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
//                   Date
//                 </th>
//                 <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
//                   Status
//                 </th>
//                 <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
//                   Check In
//                 </th>
//                 <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
//                   Check Out
//                 </th>
//                 <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
//                   Total Hours
//                 </th>
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {isLoading ? (
//                 <tr>
//                   <td colSpan={5} className="text-center py-12 text-indigo-600">
//                     <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
//                     <p className="text-sm">Generating report...</p>
//                   </td>
//                 </tr>
//               ) : error ? (
//                 <tr>
//                   <td colSpan={5} className="text-center py-12 text-gray-500">
//                     <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-red-500" />
//                     <p className="text-red-700">Error: {error}</p>
//                   </td>
//                 </tr>
//               ) : reportData.length === 0 ? (
//                 <tr>
//                   <td colSpan={5} className="text-center py-12 text-gray-500">
//                     <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-yellow-500" />
//                     <p>No data found for this date range.</p>
//                   </td>
//                 </tr>
//               ) : (
//                 reportData.map((row) => (
//                   <tr
//                     key={row.date}
//                     className={`${
//                       row.status === "Absent"
//                         ? "bg-red-50 hover:bg-red-100"
//                         : "hover:bg-gray-50"
//                     } transition cursor-pointer`}
//                     onClick={() => setSelectedDay(row)} // Open modal on click
//                   >
//                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
//                       {row.date}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       {getStatusBadge(row.status)}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
//                       {formatTime(row.checkIn)}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
//                       {formatTime(row.checkOut)}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-600">
//                       {row.status === "Present"
//                         ? minutesToHours(row.totalWorkMinutes)
//                         : "---"}
//                     </td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* Render the Modal */}
//       {selectedDay && (
//         <DailyDetailModal
//           day={selectedDay}
//           onClose={() => setSelectedDay(null)}
//         />
//       )}
//     </div>
//   );
// };

// export default UserAttendanceReport;
