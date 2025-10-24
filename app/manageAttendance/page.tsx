"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Loader2,
  Users,
  Clock,
  Filter,
  AlertTriangle,
  X,
  MapPin,
  Calendar,
  TrendingUp,
  Pencil, // Added icon
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// --- CONFIGURATION ---
const API_BASE_URL = "http://localhost:5050";

// --- TYPES ---
interface HistoryFilterParams {
  branchId?: string;
  positionId?: string;
  startDate?: string;
  endDate?: string;
}

interface SummaryData {
  totalEntries: number;
  totalUsers: number;
  totalWorkHours: string;
}

interface DetailedAttendanceRecord {
  AttendanceId: string;
  WorkDate: string;
  CheckInAt: string | null;
  CheckOutAt: string | null;
  BreakInAt: string | null;
  BreakOutAt: string | null;
  SelfiePhotoUrl: string | null;
  FullName: string;
  StaffId: string;
  PositionName: string | null;
  BranchName: string | null;
  WorkDurationHours: number | null;
}

interface FilterOption {
  [key: string]: any;
}

// --- UTILITY FUNCTIONS ---
const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString();
};

const formatTime = (timeString: string | null) => {
  if (!timeString) return "—";
  return new Date(timeString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDuration = (hours: number | null) => {
  if (hours === null) return "—";
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  return `${h}h ${m}m`;
};

const calculateBreakDuration = (
  breakIn: string | null,
  breakOut: string | null
) => {
  if (!breakIn) return "—";
  try {
    const inTime = new Date(breakIn).getTime();
    const outTime = breakOut ? new Date(breakOut).getTime() : Date.now();
    const diffMs = outTime - inTime;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  } catch {
    return "—";
  }
};

/**
 * Formats a Date object into 'YYYY-MM-DDTHH:MM' for datetime-local input
 */
const formatToISOLocal = (date: Date): string => {
  const pad = (num: number) => num.toString().padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const fetchFilterOptions = async (endpoint: string) => {
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
        name: item.BranchName || item.PositionName || item.Name || item.name,
      }));
    } else {
      console.error(`API ${endpoint} failed:`, await response.text());
    }
  } catch (error) {
    console.error(`Failed to fetch ${endpoint}:`, error);
  }
  return [];
};

// Added new patchData function
const patchData = async (url: string, data: any) => {
  const token = window.localStorage?.getItem("token");
  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(data),
  });
  return {
    data: await response.json().catch(() => ({ message: response.statusText })),
    ok: response.ok,
    status: response.status,
  };
};

// --- COMPONENTS ---

// Detailed View Modal Component
// Updated Modal Props
const AttendanceDetailModal: React.FC<{
  record: DetailedAttendanceRecord;
  allRecords: DetailedAttendanceRecord[];
  onClose: () => void;
  onRecordUpdate: () => void; // <-- ADDED PROP
}> = ({ record, allRecords, onClose, onRecordUpdate }) => {
  // <-- ADDED PROP
  // Generate chart data for the last 7 days for this specific staff
  const chartData = useMemo(() => {
    const staffRecords = allRecords
      .filter((r) => r.StaffId === record.StaffId)
      .sort(
        (a, b) =>
          new Date(a.WorkDate).getTime() - new Date(b.WorkDate).getTime()
      )
      .slice(-7);

    return staffRecords.map((r) => ({
      date: new Date(r.WorkDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      hours: r.WorkDurationHours || 0,
      checkIn: r.CheckInAt
        ? new Date(r.CheckInAt).getHours() +
          new Date(r.CheckInAt).getMinutes() / 60
        : 0,
    }));
  }, [record.StaffId, allRecords]);

  // Calculate statistics
  const stats = useMemo(() => {
    const staffRecords = allRecords.filter((r) => r.StaffId === record.StaffId);
    const totalHours = staffRecords.reduce(
      (sum, r) => sum + (r.WorkDurationHours || 0),
      0
    );
    const avgHours =
      staffRecords.length > 0 ? totalHours / staffRecords.length : 0;
    const completedShifts = staffRecords.filter(
      (r) => r.CheckOutAt !== null
    ).length;

    return {
      totalHours: totalHours.toFixed(2),
      avgHours: avgHours.toFixed(2),
      totalDays: staffRecords.length,
      completedShifts,
    };
  }, [record.StaffId, allRecords]);

  // Added state and edit handlers
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEditTime = useCallback(
    async (type: "check-in" | "check-out") => {
      const isCheckIn = type === "check-in";
      const timeToEdit = isCheckIn ? record.CheckInAt : record.CheckOutAt;

      if (!timeToEdit) {
        setError(`❌ No ${type} record to edit.`);
        return;
      }

      const currentTime = new Date(timeToEdit);
      const defaultValue = formatToISOLocal(currentTime);

      const newTimeStr = window.prompt(
        `Enter new ${isCheckIn ? "Check-In" : "Check-Out"} time:`,
        defaultValue
      );

      if (!newTimeStr) return; // User cancelled

      const newTime = new Date(newTimeStr);
      if (isNaN(newTime.getTime())) {
        setError("❌ Invalid date format.");
        return;
      }

      setIsProcessing(true);
      setError(null);

      const res = await patchData(
        `${API_BASE_URL}/attendance/record/${record.AttendanceId}/${type}`,
        isCheckIn
          ? { newCheckInTime: newTime.toISOString() }
          : { newCheckOutTime: newTime.toISOString() }
      );

      if (res.ok) {
        onRecordUpdate(); // This will refresh the parent component's data
      } else {
        setError(`❌ Update failed: ${res.data.message || "Server error."}`);
      }
      setIsProcessing(false);
    },
    [record, onRecordUpdate]
  );
  // --- END OF NEW CODE ---

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-bold mb-2">Attendance Details</h2>
          <p className="text-indigo-100 text-lg">{record.FullName}</p>
          <p className="text-indigo-200 text-sm">Staff ID: {record.StaffId}</p>
          <p className="text-indigo-200 text-sm">
            {formatDate(record.WorkDate)}
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Updated Time Details Card JSX */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Check In Card */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl border border-green-200 relative">
              {/* --- EDIT BUTTON --- */}
              <button
                onClick={() => handleEditTime("check-in")}
                disabled={!record.CheckInAt || isProcessing}
                title="Edit Check-In Time"
                className="absolute top-3 right-3 p-1.5 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-all disabled:opacity-50 disabled:hover:bg-transparent"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Pencil className="w-4 h-4" />
                )}
              </button>
              {/* --- END OF BUTTON --- */}

              <div className="flex items-center mb-3">
                <div className="p-2 bg-green-500 rounded-lg mr-3">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-green-600 font-medium">Check In</p>
                  <p className="text-2xl font-bold text-green-800">
                    {formatTime(record.CheckInAt)}
                  </p>
                </div>
              </div>
              <p className="text-xs text-green-600">
                {record.CheckInAt
                  ? new Date(record.CheckInAt).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>

            {/* Check Out Card */}
            <div className="bg-gradient-to-br from-red-50 to-red-100 p-5 rounded-xl border border-red-200 relative">
              {/* --- EDIT BUTTON --- */}
              <button
                onClick={() => handleEditTime("check-out")}
                disabled={!record.CheckOutAt || isProcessing}
                title="Edit Check-Out Time"
                className="absolute top-3 right-3 p-1.5 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-all disabled:opacity-50 disabled:hover:bg-transparent"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Pencil className="w-4 h-4" />
                )}
              </button>
              {/* --- END OF BUTTON --- */}

              <div className="flex items-center mb-3">
                <div className="p-2 bg-red-500 rounded-lg mr-3">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-red-600 font-medium">Check Out</p>
                  <p className="text-2xl font-bold text-red-800">
                    {record.CheckOutAt
                      ? formatTime(record.CheckOutAt)
                      : "Not yet"}
                  </p>
                </div>
              </div>
              <p className="text-xs text-red-600">
                {record.CheckOutAt
                  ? new Date(record.CheckOutAt).toLocaleDateString()
                  : "Still working"}
              </p>
            </div>

            {/* Break In Card (Unchanged) */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-5 rounded-xl border border-orange-200">
              <div className="flex items-center mb-3">
                <div className="p-2 bg-orange-500 rounded-lg mr-3">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-orange-600 font-medium">
                    Break In
                  </p>
                  <p className="text-2xl font-bold text-orange-800">
                    {formatTime(record.BreakInAt)}
                  </p>
                </div>
              </div>
              <p className="text-xs text-orange-600">
                {record.BreakInAt
                  ? new Date(record.BreakInAt).toLocaleDateString()
                  : "No break taken"}
              </p>
            </div>

            {/* Break Out Card (Unchanged) */}
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-5 rounded-xl border border-yellow-200">
              <div className="flex items-center mb-3">
                <div className="p-2 bg-yellow-500 rounded-lg mr-3">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-yellow-600 font-medium">
                    Break Out
                  </p>
                  <p className="text-2xl font-bold text-yellow-800">
                    {formatTime(record.BreakOutAt)}
                  </p>
                </div>
              </div>
              <p className="text-xs text-yellow-600">
                {record.BreakOutAt
                  ? new Date(record.BreakOutAt).toLocaleDateString()
                  : "Break ongoing"}
              </p>
            </div>
          </div>
          {/* --- END OF UPDATED SECTION --- */}

          {/* Error Message Display */}
          {error && (
            <div className="p-3 bg-red-100 border border-red-300 text-red-800 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Duration & Branch/Position */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-5 rounded-xl border border-indigo-200">
              <p className="text-sm text-indigo-600 font-medium mb-2">
                Work Duration
              </p>
              <p className="text-3xl font-bold text-indigo-800">
                {formatDuration(record.WorkDurationHours)}
              </p>
              <p className="text-xs text-indigo-600 mt-2">
                {record.WorkDurationHours !== null
                  ? `${record.WorkDurationHours.toFixed(2)} hours`
                  : "In progress"}
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-xl border border-purple-200">
              <p className="text-sm text-purple-600 font-medium mb-2">
                Break Duration
              </p>
              <p className="text-3xl font-bold text-purple-800">
                {calculateBreakDuration(record.BreakInAt, record.BreakOutAt)}
              </p>
              <p className="text-xs text-purple-600 mt-2">Total break time</p>
            </div>

            <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-5 rounded-xl border border-pink-200">
              <div className="flex items-center mb-2">
                <MapPin className="w-4 h-4 text-pink-600 mr-2" />
                <p className="text-sm text-pink-600 font-medium">
                  Branch & Position
                </p>
              </div>
              <p className="text-sm font-semibold text-pink-800 mb-1">
                {record.BranchName || "N/A Branch"}
              </p>
              <p className="text-sm text-pink-700">
                {record.PositionName || "N/A Position"}
              </p>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-600 mb-1">Total Days</p>
              <p className="text-2xl font-bold text-blue-800">
                {stats.totalDays}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-xs text-green-600 mb-1">Completed</p>
              <p className="text-2xl font-bold text-green-800">
                {stats.completedShifts}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <p className="text-xs text-purple-600 mb-1">Total Hours</p>
              <p className="text-2xl font-bold text-purple-800">
                {stats.totalHours}h
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <p className="text-xs text-orange-600 mb-1">Avg Hours</p>
              <p className="text-2xl font-bold text-orange-800">
                {stats.avgHours}h
              </p>
            </div>
          </div>

          {/* Work Hours Chart */}
          {chartData.length > 0 && (
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
              <div className="flex items-center mb-4">
                <TrendingUp className="w-5 h-5 text-indigo-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-800">
                  Last 7 Days Work Hours
                </h3>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis
                    dataKey="date"
                    stroke="#666"
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis stroke="#666" style={{ fontSize: "12px" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                    }}
                    formatter={(value: any) => [
                      `${value.toFixed(2)} hours`,
                      "Work Duration",
                    ]}
                  />
                  <Bar dataKey="hours" fill="#6366f1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Check-In Time Trend */}
          {chartData.length > 0 && (
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
              <div className="flex items-center mb-4">
                <Calendar className="w-5 h-5 text-purple-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-800">
                  Check-In Time Pattern
                </h3>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  {/* --- THIS IS THE CORRECTED LINE --- */}
                  <XAxis
                    dataKey="date"
                    stroke="#666"
                    style={{ fontSize: "12px" }}
                  />
                  {/* --- END OF FIX --- */}
                  <YAxis
                    domain={[0, 24]}
                    stroke="#666"
                    style={{ fontSize: "12px" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                    }}
                    formatter={(value: any) => {
                      const hours = Math.floor(value);
                      const minutes = Math.round((value - hours) * 60);
                      return [
                        `${hours}:${minutes.toString().padStart(2, "0")}`,
                        "Check-In Time",
                      ];
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="checkIn"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={{ fill: "#8b5cf6", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Selfie Photo */}
          {record.SelfiePhotoUrl && (
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Check-In Selfie
              </h3>
              <div className="flex justify-center">
                <img
                  src={record.SelfiePhotoUrl}
                  alt="Check-in selfie"
                  className="max-w-full max-h-64 rounded-lg shadow-lg"
                />
              </div>
              <a
                href={record.SelfiePhotoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center mt-3 text-indigo-600 hover:text-indigo-800 font-medium"
              >
                View Full Size
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 rounded-b-2xl border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Summary Card Component
const SummaryCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  value: string | number;
  gradient: string;
}> = ({ icon, title, value, gradient }) => (
  <div
    className={`flex items-center p-6 rounded-xl shadow-lg border ${gradient}`}
  >
    <div className="p-3 bg-white bg-opacity-30 rounded-full mr-4">{icon}</div>
    <div>
      <p className="text-sm font-medium text-white text-opacity-90">{title}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  </div>
);

// Filter Dropdown Component
const FilterDropdown: React.FC<{
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  dataValueKey?: string;
  dataLabelKey?: string;
}> = ({
  label,
  options,
  value,
  onChange,
  disabled,
  dataValueKey = "id",
  dataLabelKey = "name",
}) => (
  <div className="w-full">
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`mt-1 block w-full pl-3 pr-10 py-2.5 text-base border ${
        disabled ? "bg-gray-50" : "bg-white"
      } border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition`}
    >
      <option value="">All {label}s</option>
      {options.map((option) => (
        <option key={option[dataValueKey]} value={option[dataValueKey]}>
          {option[dataLabelKey]}
        </option>
      ))}
    </select>
  </div>
);

// Main Component
const ManageAttendance = () => {
  const [history, setHistory] = useState<DetailedAttendanceRecord[]>([]);
  const [summary, setSummary] = useState<SummaryData>({
    totalEntries: 0,
    totalUsers: 0,
    totalWorkHours: "0.00",
  });
  const [loading, setLoading] = useState(false);
  const [filterListsLoading, setFilterListsLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] =
    useState<DetailedAttendanceRecord | null>(null);

  const [branchFilter, setBranchFilter] = useState("");
  const [positionFilter, setPositionFilter] = useState("");
  const [startDate, setStartDate] = useState(
    () =>
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );

  const [branches, setBranches] = useState<FilterOption[]>([]);
  const [positions, setPositions] = useState<FilterOption[]>([]);

  // --- FETCH DATA ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      console.error("Authentication token not found.");
      return;
    }

    try {
      const url = new URL(`${API_BASE_URL}/attendance/history/all`);
      if (branchFilter) url.searchParams.append("branchId", branchFilter);
      if (positionFilter) url.searchParams.append("positionId", positionFilter);
      url.searchParams.append("startDate", startDate);
      url.searchParams.append("endDate", endDate);

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();

      if (response.ok) {
        setHistory(data.details || []);
        setSummary(
          data.summary || {
            totalEntries: 0,
            totalUsers: 0,
            totalWorkHours: "0.00",
          }
        );
      } else {
        console.error("API Error:", data.message);
        setHistory([]);
        setSummary({ totalEntries: 0, totalUsers: 0, totalWorkHours: "0.00" });
      }
    } catch (error) {
      console.error("Failed to fetch attendance history:", error);
    } finally {
      setLoading(false);
    }
  }, [branchFilter, positionFilter, startDate, endDate]);

  // Initial load for filter options
  useEffect(() => {
    const loadFilters = async () => {
      setFilterListsLoading(true);
      const [branchList, positionList] = await Promise.all([
        fetchFilterOptions("branches"),
        fetchFilterOptions("positions"),
      ]);
      setBranches(branchList);
      setPositions(positionList);
      setFilterListsLoading(false);
    };
    loadFilters();
  }, []);

  // Initial data load and data re-load on filter change
  useEffect(() => {
    if (!filterListsLoading) {
      fetchData();
    }
  }, [fetchData, filterListsLoading]);

  return (
    <div className="p-6 md:p-10 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8 pb-2">
        Attendance Monitoring Dashboard
      </h1>

      {/* Filter Panel */}
      <div className="bg-white p-6 rounded-2xl shadow-lg mb-8 border border-gray-200">
        <div className="flex items-center text-lg font-semibold text-gray-700 mb-4">
          <Filter className="w-5 h-5 mr-2 text-indigo-500" />
          Filter Data
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <FilterDropdown
            label="Branch"
            options={branches}
            value={branchFilter}
            onChange={setBranchFilter}
            disabled={filterListsLoading}
          />
          <FilterDropdown
            label="Position"
            options={positions}
            value={positionFilter}
            onChange={setPositionFilter}
            disabled={filterListsLoading}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 block w-full px-3 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 block w-full px-3 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        <SummaryCard
          icon={<Clock className="w-6 h-6" />}
          title="Total Work Hours"
          value={`${summary.totalWorkHours}h`}
          gradient="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <SummaryCard
          icon={<Users className="w-6 h-6" />}
          title="Unique Employees"
          value={summary.totalUsers}
          gradient="bg-gradient-to-br from-purple-500 to-purple-600"
        />
        <SummaryCard
          icon={<Calendar className="w-6 h-6" />}
          title="Total Entries"
          value={summary.totalEntries}
          gradient="bg-gradient-to-br from-indigo-500 to-indigo-600"
        />
      </div>

      {/* Detailed Table */}
      <div className="bg-white shadow-2xl rounded-2xl overflow-hidden border border-gray-200">
        <h2 className="text-xl font-semibold p-6 border-b bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800">
          Attendance Details
        </h2>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Check In
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Check Out
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Break In
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Break Out
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Branch / Position
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Hours
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Selfie
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-indigo-600">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
                    <p className="text-sm">Loading attendance data...</p>
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-500">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-yellow-500" />
                    <p>No attendance records match the current filters.</p>
                  </td>
                </tr>
              ) : (
                history.map((record) => (
                  <tr
                    key={record.AttendanceId}
                    onClick={() => setSelectedRecord(record)}
                    className="hover:bg-indigo-50 cursor-pointer transition duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {record.FullName}
                      </div>
                      <div className="text-xs text-gray-500">
                        Staff ID: {record.StaffId}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatDate(record.WorkDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 text-sm font-semibold text-green-800 bg-green-100 rounded-full">
                        {formatTime(record.CheckInAt)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 text-sm font-semibold rounded-full ${
                          record.CheckOutAt
                            ? "text-red-800 bg-red-100"
                            : "text-gray-600 bg-gray-100"
                        }`}
                      >
                        {formatTime(record.CheckOutAt)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 text-sm font-semibold rounded-full ${
                          record.BreakInAt
                            ? "text-orange-800 bg-orange-100"
                            : "text-gray-600 bg-gray-100"
                        }`}
                      >
                        {formatTime(record.BreakInAt)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 text-sm font-semibold rounded-full ${
                          record.BreakOutAt
                            ? "text-yellow-800 bg-yellow-100"
                            : "text-gray-600 bg-gray-100"
                        }`}
                      >
                        {formatTime(record.BreakOutAt)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {record.BranchName || "N/A Branch"} /{" "}
                      {record.PositionName || "N/A Position"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-700">
                      {record.WorkDurationHours !== null
                        ? `${record.WorkDurationHours.toFixed(2)}`
                        : "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.SelfiePhotoUrl ? (
                        <a
                          href={record.SelfiePhotoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Updated Modal Call */}
      {selectedRecord && (
        <AttendanceDetailModal
          record={selectedRecord}
          allRecords={history}
          onClose={() => setSelectedRecord(null)}
          onRecordUpdate={fetchData} // <-- ADDED THIS PROP TO REFRESH DATA
        />
      )}
    </div>
  );
};

export default ManageAttendance;

//=========================================================//

// "use client";
// import React, { useState, useEffect, useCallback, useMemo } from "react";
// import {
//   Loader2,
//   Users,
//   Clock,
//   Filter,
//   AlertTriangle,
//   X,
//   MapPin,
//   Calendar,
//   TrendingUp,
// } from "lucide-react";
// import {
//   LineChart,
//   Line,
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
// } from "recharts";

// // --- CONFIGURATION ---
// const API_BASE_URL = "http://localhost:5050";

// // --- TYPES ---
// interface HistoryFilterParams {
//   branchId?: string;
//   positionId?: string;
//   startDate?: string;
//   endDate?: string;
// }

// interface SummaryData {
//   totalEntries: number;
//   totalUsers: number;
//   totalWorkHours: string;
// }

// interface DetailedAttendanceRecord {
//   AttendanceId: string;
//   WorkDate: string;
//   CheckInAt: string | null;
//   CheckOutAt: string | null;
//   BreakInAt: string | null;
//   BreakOutAt: string | null;
//   SelfiePhotoUrl: string | null;
//   FullName: string;
//   StaffId: string;
//   PositionName: string | null;
//   BranchName: string | null;
//   WorkDurationHours: number | null;
// }

// interface FilterOption {
//   [key: string]: any;
// }

// // --- UTILITY FUNCTIONS ---
// const formatDate = (dateString: string) => {
//   if (!dateString) return "N/A";
//   return new Date(dateString).toLocaleDateString();
// };

// const formatTime = (timeString: string | null) => {
//   if (!timeString) return "—";
//   return new Date(timeString).toLocaleTimeString([], {
//     hour: "2-digit",
//     minute: "2-digit",
//   });
// };

// const formatDuration = (hours: number | null) => {
//   if (hours === null) return "—";
//   const h = Math.floor(hours);
//   const m = Math.floor((hours - h) * 60);
//   return `${h}h ${m}m`;
// };

// const calculateBreakDuration = (
//   breakIn: string | null,
//   breakOut: string | null
// ) => {
//   if (!breakIn) return "—";
//   try {
//     const inTime = new Date(breakIn).getTime();
//     const outTime = breakOut ? new Date(breakOut).getTime() : Date.now();
//     const diffMs = outTime - inTime;
//     const hours = Math.floor(diffMs / (1000 * 60 * 60));
//     const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
//     return `${hours}h ${minutes}m`;
//   } catch {
//     return "—";
//   }
// };

// const fetchFilterOptions = async (endpoint: string) => {
//   const token = localStorage.getItem("token");
//   if (!token) return [];

//   try {
//     const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
//       headers: { Authorization: `Bearer ${token}` },
//     });

//     if (response.ok) {
//       const fullResponse = await response.json();
//       const dataToMap = fullResponse.items || [];

//       return dataToMap.map((item: any) => ({
//         id: item.BranchId || item.PositionId || item.id,
//         name: item.BranchName || item.PositionName || item.Name || item.name,
//       }));
//     } else {
//       console.error(`API ${endpoint} failed:`, await response.text());
//     }
//   } catch (error) {
//     console.error(`Failed to fetch ${endpoint}:`, error);
//   }
//   return [];
// };

// // --- COMPONENTS ---

// // Detailed View Modal Component
// const AttendanceDetailModal: React.FC<{
//   record: DetailedAttendanceRecord;
//   allRecords: DetailedAttendanceRecord[];
//   onClose: () => void;
// }> = ({ record, allRecords, onClose }) => {
//   // Generate chart data for the last 7 days for this specific staff
//   const chartData = useMemo(() => {
//     const staffRecords = allRecords
//       .filter((r) => r.StaffId === record.StaffId)
//       .sort(
//         (a, b) =>
//           new Date(a.WorkDate).getTime() - new Date(b.WorkDate).getTime()
//       )
//       .slice(-7);

//     return staffRecords.map((r) => ({
//       date: new Date(r.WorkDate).toLocaleDateString("en-US", {
//         month: "short",
//         day: "numeric",
//       }),
//       hours: r.WorkDurationHours || 0,
//       checkIn: r.CheckInAt
//         ? new Date(r.CheckInAt).getHours() +
//           new Date(r.CheckInAt).getMinutes() / 60
//         : 0,
//     }));
//   }, [record.StaffId, allRecords]);

//   // Calculate statistics
//   const stats = useMemo(() => {
//     const staffRecords = allRecords.filter((r) => r.StaffId === record.StaffId);
//     const totalHours = staffRecords.reduce(
//       (sum, r) => sum + (r.WorkDurationHours || 0),
//       0
//     );
//     const avgHours =
//       staffRecords.length > 0 ? totalHours / staffRecords.length : 0;
//     const completedShifts = staffRecords.filter(
//       (r) => r.CheckOutAt !== null
//     ).length;

//     return {
//       totalHours: totalHours.toFixed(2),
//       avgHours: avgHours.toFixed(2),
//       totalDays: staffRecords.length,
//       completedShifts,
//     };
//   }, [record.StaffId, allRecords]);

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//       <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
//         {/* Header */}
//         <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl relative">
//           <button
//             onClick={onClose}
//             className="absolute top-4 right-4 p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition"
//           >
//             <X className="w-5 h-5" />
//           </button>
//           <h2 className="text-2xl font-bold mb-2">Attendance Details</h2>
//           <p className="text-indigo-100 text-lg">{record.FullName}</p>
//           <p className="text-indigo-200 text-sm">Staff ID: {record.StaffId}</p>
//           <p className="text-indigo-200 text-sm">
//             {formatDate(record.WorkDate)}
//           </p>
//         </div>

//         <div className="p-6 space-y-6">
//           {/* Time Details Card */}
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//             <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl border border-green-200">
//               <div className="flex items-center mb-3">
//                 <div className="p-2 bg-green-500 rounded-lg mr-3">
//                   <Clock className="w-5 h-5 text-white" />
//                 </div>
//                 <div>
//                   <p className="text-sm text-green-600 font-medium">Check In</p>
//                   <p className="text-2xl font-bold text-green-800">
//                     {formatTime(record.CheckInAt)}
//                   </p>
//                 </div>
//               </div>
//               <p className="text-xs text-green-600">
//                 {record.CheckInAt
//                   ? new Date(record.CheckInAt).toLocaleDateString()
//                   : "N/A"}
//               </p>
//             </div>

//             <div className="bg-gradient-to-br from-red-50 to-red-100 p-5 rounded-xl border border-red-200">
//               <div className="flex items-center mb-3">
//                 <div className="p-2 bg-red-500 rounded-lg mr-3">
//                   <Clock className="w-5 h-5 text-white" />
//                 </div>
//                 <div>
//                   <p className="text-sm text-red-600 font-medium">Check Out</p>
//                   <p className="text-2xl font-bold text-red-800">
//                     {record.CheckOutAt
//                       ? formatTime(record.CheckOutAt)
//                       : "Not yet"}
//                   </p>
//                 </div>
//               </div>
//               <p className="text-xs text-red-600">
//                 {record.CheckOutAt
//                   ? new Date(record.CheckOutAt).toLocaleDateString()
//                   : "Still working"}
//               </p>
//             </div>

//             <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-5 rounded-xl border border-orange-200">
//               <div className="flex items-center mb-3">
//                 <div className="p-2 bg-orange-500 rounded-lg mr-3">
//                   <Clock className="w-5 h-5 text-white" />
//                 </div>
//                 <div>
//                   <p className="text-sm text-orange-600 font-medium">
//                     Break In
//                   </p>
//                   <p className="text-2xl font-bold text-orange-800">
//                     {formatTime(record.BreakInAt)}
//                   </p>
//                 </div>
//               </div>
//               <p className="text-xs text-orange-600">
//                 {record.BreakInAt
//                   ? new Date(record.BreakInAt).toLocaleDateString()
//                   : "No break taken"}
//               </p>
//             </div>

//             <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-5 rounded-xl border border-yellow-200">
//               <div className="flex items-center mb-3">
//                 <div className="p-2 bg-yellow-500 rounded-lg mr-3">
//                   <Clock className="w-5 h-5 text-white" />
//                 </div>
//                 <div>
//                   <p className="text-sm text-yellow-600 font-medium">
//                     Break Out
//                   </p>
//                   <p className="text-2xl font-bold text-yellow-800">
//                     {formatTime(record.BreakOutAt)}
//                   </p>
//                 </div>
//               </div>
//               <p className="text-xs text-yellow-600">
//                 {record.BreakOutAt
//                   ? new Date(record.BreakOutAt).toLocaleDateString()
//                   : "Break ongoing"}
//               </p>
//             </div>
//           </div>

//           {/* Duration & Branch/Position */}
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-5 rounded-xl border border-indigo-200">
//               <p className="text-sm text-indigo-600 font-medium mb-2">
//                 Work Duration
//               </p>
//               <p className="text-3xl font-bold text-indigo-800">
//                 {formatDuration(record.WorkDurationHours)}
//               </p>
//               <p className="text-xs text-indigo-600 mt-2">
//                 {record.WorkDurationHours !== null
//                   ? `${record.WorkDurationHours.toFixed(2)} hours`
//                   : "In progress"}
//               </p>
//             </div>

//             <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-xl border border-purple-200">
//               <p className="text-sm text-purple-600 font-medium mb-2">
//                 Break Duration
//               </p>
//               <p className="text-3xl font-bold text-purple-800">
//                 {calculateBreakDuration(record.BreakInAt, record.BreakOutAt)}
//               </p>
//               <p className="text-xs text-purple-600 mt-2">Total break time</p>
//             </div>

//             <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-5 rounded-xl border border-pink-200">
//               <div className="flex items-center mb-2">
//                 <MapPin className="w-4 h-4 text-pink-600 mr-2" />
//                 <p className="text-sm text-pink-600 font-medium">
//                   Branch & Position
//                 </p>
//               </div>
//               <p className="text-sm font-semibold text-pink-800 mb-1">
//                 {record.BranchName || "N/A Branch"}
//               </p>
//               <p className="text-sm text-pink-700">
//                 {record.PositionName || "N/A Position"}
//               </p>
//             </div>
//           </div>

//           {/* Statistics Cards */}
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
//             <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
//               <p className="text-xs text-blue-600 mb-1">Total Days</p>
//               <p className="text-2xl font-bold text-blue-800">
//                 {stats.totalDays}
//               </p>
//             </div>
//             <div className="bg-green-50 p-4 rounded-lg border border-green-200">
//               <p className="text-xs text-green-600 mb-1">Completed</p>
//               <p className="text-2xl font-bold text-green-800">
//                 {stats.completedShifts}
//               </p>
//             </div>
//             <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
//               <p className="text-xs text-purple-600 mb-1">Total Hours</p>
//               <p className="text-2xl font-bold text-purple-800">
//                 {stats.totalHours}h
//               </p>
//             </div>
//             <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
//               <p className="text-xs text-orange-600 mb-1">Avg Hours</p>
//               <p className="text-2xl font-bold text-orange-800">
//                 {stats.avgHours}h
//               </p>
//             </div>
//           </div>

//           {/* Work Hours Chart */}
//           {chartData.length > 0 && (
//             <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
//               <div className="flex items-center mb-4">
//                 <TrendingUp className="w-5 h-5 text-indigo-600 mr-2" />
//                 <h3 className="text-lg font-semibold text-gray-800">
//                   Last 7 Days Work Hours
//                 </h3>
//               </div>
//               <ResponsiveContainer width="100%" height={250}>
//                 <BarChart data={chartData}>
//                   <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
//                   <XAxis
//                     dataKey="date"
//                     stroke="#666"
//                     style={{ fontSize: "12px" }}
//                   />
//                   <YAxis stroke="#666" style={{ fontSize: "12px" }} />
//                   <Tooltip
//                     contentStyle={{
//                       backgroundColor: "#fff",
//                       border: "1px solid #ddd",
//                       borderRadius: "8px",
//                     }}
//                     formatter={(value: any) => [
//                       `${value.toFixed(2)} hours`,
//                       "Work Duration",
//                     ]}
//                   />
//                   <Bar dataKey="hours" fill="#6366f1" radius={[8, 8, 0, 0]} />
//                 </BarChart>
//               </ResponsiveContainer>
//             </div>
//           )}

//           {/* Check-In Time Trend */}
//           {chartData.length > 0 && (
//             <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
//               <div className="flex items-center mb-4">
//                 <Calendar className="w-5 h-5 text-purple-600 mr-2" />
//                 <h3 className="text-lg font-semibold text-gray-800">
//                   Check-In Time Pattern
//                 </h3>
//               </div>
//               <ResponsiveContainer width="100%" height={200}>
//                 <LineChart data={chartData}>
//                   <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
//                   <XAxis
//                     dataKey="date"
//                     stroke="#666"
//                     style={{ fontSize: "12px" }}
//                   />
//                   <YAxis
//                     domain={[0, 24]}
//                     stroke="#666"
//                     style={{ fontSize: "12px" }}
//                   />
//                   <Tooltip
//                     contentStyle={{
//                       backgroundColor: "#fff",
//                       border: "1px solid #ddd",
//                       borderRadius: "8px",
//                     }}
//                     formatter={(value: any) => {
//                       const hours = Math.floor(value);
//                       const minutes = Math.round((value - hours) * 60);
//                       return [
//                         `${hours}:${minutes.toString().padStart(2, "0")}`,
//                         "Check-In Time",
//                       ];
//                     }}
//                   />
//                   <Line
//                     type="monotone"
//                     dataKey="checkIn"
//                     stroke="#8b5cf6"
//                     strokeWidth={2}
//                     dot={{ fill: "#8b5cf6", r: 4 }}
//                   />
//                 </LineChart>
//               </ResponsiveContainer>
//             </div>
//           )}

//           {/* Selfie Photo */}
//           {record.SelfiePhotoUrl && (
//             <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
//               <h3 className="text-lg font-semibold text-gray-800 mb-3">
//                 Check-In Selfie
//               </h3>
//               <div className="flex justify-center">
//                 <img
//                   src={record.SelfiePhotoUrl}
//                   alt="Check-in selfie"
//                   className="max-w-full max-h-64 rounded-lg shadow-lg"
//                 />
//               </div>
//               <a
//                 href={record.SelfiePhotoUrl}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 className="block text-center mt-3 text-indigo-600 hover:text-indigo-800 font-medium"
//               >
//                 View Full Size
//               </a>
//             </div>
//           )}
//         </div>

//         {/* Footer */}
//         <div className="bg-gray-50 p-4 rounded-b-2xl border-t flex justify-end">
//           <button
//             onClick={onClose}
//             className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
//           >
//             Close
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// // Summary Card Component
// const SummaryCard: React.FC<{
//   icon: React.ReactNode;
//   title: string;
//   value: string | number;
//   gradient: string;
// }> = ({ icon, title, value, gradient }) => (
//   <div
//     className={`flex items-center p-6 rounded-xl shadow-lg border ${gradient}`}
//   >
//     <div className="p-3 bg-white bg-opacity-30 rounded-full mr-4">{icon}</div>
//     <div>
//       <p className="text-sm font-medium text-white text-opacity-90">{title}</p>
//       <p className="text-3xl font-bold text-white">{value}</p>
//     </div>
//   </div>
// );

// // Filter Dropdown Component
// const FilterDropdown: React.FC<{
//   label: string;
//   options: FilterOption[];
//   value: string;
//   onChange: (value: string) => void;
//   disabled: boolean;
//   dataValueKey?: string;
//   dataLabelKey?: string;
// }> = ({
//   label,
//   options,
//   value,
//   onChange,
//   disabled,
//   dataValueKey = "id",
//   dataLabelKey = "name",
// }) => (
//   <div className="w-full">
//     <label className="block text-sm font-medium text-gray-700 mb-1">
//       {label}
//     </label>
//     <select
//       value={value}
//       onChange={(e) => onChange(e.target.value)}
//       disabled={disabled}
//       className={`mt-1 block w-full pl-3 pr-10 py-2.5 text-base border ${
//         disabled ? "bg-gray-50" : "bg-white"
//       } border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition`}
//     >
//       <option value="">All {label}s</option>
//       {options.map((option) => (
//         <option key={option[dataValueKey]} value={option[dataValueKey]}>
//           {option[dataLabelKey]}
//         </option>
//       ))}
//     </select>
//   </div>
// );

// // Main Component
// const ManageAttendance = () => {
//   const [history, setHistory] = useState<DetailedAttendanceRecord[]>([]);
//   const [summary, setSummary] = useState<SummaryData>({
//     totalEntries: 0,
//     totalUsers: 0,
//     totalWorkHours: "0.00",
//   });
//   const [loading, setLoading] = useState(false);
//   const [filterListsLoading, setFilterListsLoading] = useState(true);
//   const [selectedRecord, setSelectedRecord] =
//     useState<DetailedAttendanceRecord | null>(null);

//   const [branchFilter, setBranchFilter] = useState("");
//   const [positionFilter, setPositionFilter] = useState("");
//   const [startDate, setStartDate] = useState(
//     () =>
//       new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
//         .toISOString()
//         .split("T")[0]
//   );
//   const [endDate, setEndDate] = useState(
//     () => new Date().toISOString().split("T")[0]
//   );

//   const [branches, setBranches] = useState<FilterOption[]>([]);
//   const [positions, setPositions] = useState<FilterOption[]>([]);

//   // --- FETCH DATA ---
//   const fetchData = useCallback(async () => {
//     setLoading(true);
//     const token = localStorage.getItem("token");
//     if (!token) {
//       setLoading(false);
//       console.error("Authentication token not found.");
//       return;
//     }

//     try {
//       const url = new URL(`${API_BASE_URL}/attendance/history/all`);
//       if (branchFilter) url.searchParams.append("branchId", branchFilter);
//       if (positionFilter) url.searchParams.append("positionId", positionFilter);
//       url.searchParams.append("startDate", startDate);
//       url.searchParams.append("endDate", endDate);

//       const response = await fetch(url.toString(), {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//       });
//       const data = await response.json();

//       if (response.ok) {
//         setHistory(data.details || []);
//         setSummary(
//           data.summary || {
//             totalEntries: 0,
//             totalUsers: 0,
//             totalWorkHours: "0.00",
//           }
//         );
//       } else {
//         console.error("API Error:", data.message);
//         setHistory([]);
//         setSummary({ totalEntries: 0, totalUsers: 0, totalWorkHours: "0.00" });
//       }
//     } catch (error) {
//       console.error("Failed to fetch attendance history:", error);
//     } finally {
//       setLoading(false);
//     }
//   }, [branchFilter, positionFilter, startDate, endDate]);

//   // Initial load for filter options
//   useEffect(() => {
//     const loadFilters = async () => {
//       setFilterListsLoading(true);
//       const [branchList, positionList] = await Promise.all([
//         fetchFilterOptions("branches"),
//         fetchFilterOptions("positions"),
//       ]);
//       setBranches(branchList);
//       setPositions(positionList);
//       setFilterListsLoading(false);
//     };
//     loadFilters();
//   }, []);

//   // Initial data load and data re-load on filter change
//   useEffect(() => {
//     if (!filterListsLoading) {
//       fetchData();
//     }
//   }, [fetchData, filterListsLoading]);

//   return (
//     <div className="p-6 md:p-10 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
//       <h1 className="text-4xl font-extrabold text-gray-900 mb-8 pb-2">
//         Attendance Monitoring Dashboard
//       </h1>

//       {/* Filter Panel */}
//       <div className="bg-white p-6 rounded-2xl shadow-lg mb-8 border border-gray-200">
//         <div className="flex items-center text-lg font-semibold text-gray-700 mb-4">
//           <Filter className="w-5 h-5 mr-2 text-indigo-500" />
//           Filter Data
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//           <FilterDropdown
//             label="Branch"
//             options={branches}
//             value={branchFilter}
//             onChange={setBranchFilter}
//             disabled={filterListsLoading}
//           />
//           <FilterDropdown
//             label="Position"
//             options={positions}
//             value={positionFilter}
//             onChange={setPositionFilter}
//             disabled={filterListsLoading}
//           />
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Start Date
//             </label>
//             <input
//               type="date"
//               value={startDate}
//               onChange={(e) => setStartDate(e.target.value)}
//               className="mt-1 block w-full px-3 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition"
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               End Date
//             </label>
//             <input
//               type="date"
//               value={endDate}
//               onChange={(e) => setEndDate(e.target.value)}
//               className="mt-1 block w-full px-3 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition"
//             />
//           </div>
//         </div>
//       </div>

//       {/* Summary Cards */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
//         <SummaryCard
//           icon={<Clock className="w-6 h-6" />}
//           title="Total Work Hours"
//           value={`${summary.totalWorkHours}h`}
//           gradient="bg-gradient-to-br from-blue-500 to-blue-600"
//         />
//         <SummaryCard
//           icon={<Users className="w-6 h-6" />}
//           title="Unique Employees"
//           value={summary.totalUsers}
//           gradient="bg-gradient-to-br from-purple-500 to-purple-600"
//         />
//         <SummaryCard
//           icon={<Calendar className="w-6 h-6" />}
//           title="Total Entries"
//           value={summary.totalEntries}
//           gradient="bg-gradient-to-br from-indigo-500 to-indigo-600"
//         />
//       </div>

//       {/* Detailed Table */}
//       <div className="bg-white shadow-2xl rounded-2xl overflow-hidden border border-gray-200">
//         <h2 className="text-xl font-semibold p-6 border-b bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800">
//           Attendance Details
//         </h2>

//         <div className="overflow-x-auto">
//           <table className="min-w-full divide-y divide-gray-200">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
//                   Employee
//                 </th>
//                 <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
//                   Date
//                 </th>
//                 <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
//                   Check In
//                 </th>
//                 <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
//                   Check Out
//                 </th>
//                 <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
//                   Break In
//                 </th>
//                 <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
//                   Break Out
//                 </th>
//                 <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
//                   Branch / Position
//                 </th>
//                 <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
//                   Hours
//                 </th>
//                 <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
//                   Selfie
//                 </th>
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {loading ? (
//                 <tr>
//                   <td colSpan={9} className="text-center py-12 text-indigo-600">
//                     <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
//                     <p className="text-sm">Loading attendance data...</p>
//                   </td>
//                 </tr>
//               ) : history.length === 0 ? (
//                 <tr>
//                   <td colSpan={9} className="text-center py-12 text-gray-500">
//                     <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-yellow-500" />
//                     <p>No attendance records match the current filters.</p>
//                   </td>
//                 </tr>
//               ) : (
//                 history.map((record) => (
//                   <tr
//                     key={record.AttendanceId}
//                     onClick={() => setSelectedRecord(record)}
//                     className="hover:bg-indigo-50 cursor-pointer transition duration-150"
//                   >
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <div className="text-sm font-medium text-gray-900">
//                         {record.FullName}
//                       </div>
//                       <div className="text-xs text-gray-500">
//                         Staff ID: {record.StaffId}
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
//                       {formatDate(record.WorkDate)}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <span className="px-3 py-1 text-sm font-semibold text-green-800 bg-green-100 rounded-full">
//                         {formatTime(record.CheckInAt)}
//                       </span>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <span
//                         className={`px-3 py-1 text-sm font-semibold rounded-full ${
//                           record.CheckOutAt
//                             ? "text-red-800 bg-red-100"
//                             : "text-gray-600 bg-gray-100"
//                         }`}
//                       >
//                         {formatTime(record.CheckOutAt)}
//                       </span>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <span
//                         className={`px-3 py-1 text-sm font-semibold rounded-full ${
//                           record.BreakInAt
//                             ? "text-orange-800 bg-orange-100"
//                             : "text-gray-600 bg-gray-100"
//                         }`}
//                       >
//                         {formatTime(record.BreakInAt)}
//                       </span>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <span
//                         className={`px-3 py-1 text-sm font-semibold rounded-full ${
//                           record.BreakOutAt
//                             ? "text-yellow-800 bg-yellow-100"
//                             : "text-gray-600 bg-gray-100"
//                         }`}
//                       >
//                         {formatTime(record.BreakOutAt)}
//                       </span>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
//                       {record.BranchName || "N/A Branch"} /{" "}
//                       {record.PositionName || "N/A Position"}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-700">
//                       {record.WorkDurationHours !== null
//                         ? `${record.WorkDurationHours.toFixed(2)}`
//                         : "—"}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       {record.SelfiePhotoUrl ? (
//                         <a
//                           href={record.SelfiePhotoUrl}
//                           target="_blank"
//                           rel="noopener noreferrer"
//                           className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
//                           onClick={(e) => e.stopPropagation()}
//                         >
//                           View
//                         </a>
//                       ) : (
//                         "—"
//                       )}
//                     </td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* Detail Modal */}
//       {selectedRecord && (
//         <AttendanceDetailModal
//           record={selectedRecord}
//           allRecords={history}
//           onClose={() => setSelectedRecord(null)}
//         />
//       )}
//     </div>
//   );
// };

// export default ManageAttendance;
