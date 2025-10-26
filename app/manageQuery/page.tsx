"use client";
import { useEffect, useState, useCallback } from "react";
import {
  MessageSquare,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  X,
  Calendar,
  Paperclip,
  Send,
  Eye,
} from "lucide-react";

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/attendance`;

interface AttendanceRecord {
  AttendanceId: string;
  WorkDate: string;
  CheckInAt: string | null;
  CheckOutAt: string | null;

  BreakInAt: string | null;
  BreakOutAt: string | null;
}

interface Query {
  QueryId: string;
  UserId: string;
  AttendanceId: string | null;
  Subject: string;
  Message: string;
  ProofUrl: string | null;
  Status: string;
  RaisedAt: string;
  ResolvedBy: string | null;
  ResolutionNotes: string | null;
  UserName?: string;
  UserStaffId?: string;
}

// Enhanced Button Component
const Button = ({
  children,
  onClick,
  disabled = false,
  variant = "primary",
  className = "",
}: any) => {
  let baseStyle =
    "px-6 py-3 font-semibold rounded-xl transition-all duration-300 shadow-lg transform hover:scale-105 active:scale-95 disabled:transform-none disabled:hover:scale-100";

  if (variant === "secondary") {
    baseStyle +=
      " bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 hover:from-gray-200 hover:to-gray-300";
  } else if (variant === "success") {
    baseStyle +=
      " bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 hover:shadow-green-500/50";
  } else if (variant === "danger") {
    baseStyle +=
      " bg-gradient-to-r from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700 hover:shadow-red-500/50";
  } else if (variant === "warning") {
    baseStyle +=
      " bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600 hover:shadow-yellow-500/50";
  } else {
    baseStyle +=
      " bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 hover:shadow-indigo-500/50";
  }

  if (disabled) {
    baseStyle =
      "px-6 py-3 font-semibold rounded-xl bg-gray-300 text-gray-500 cursor-not-allowed opacity-60";
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${className}`}
    >
      {children}
    </button>
  );
};

// API Helper Functions
const fetchData = async (url: string) => {
  const token = window.localStorage?.getItem("token");
  const response = await fetch(url, {
    method: "GET",
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
  return {
    data: await response.json().catch(() => ({ message: response.statusText })),
    ok: response.ok,
    status: response.status,
  };
};

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

// Formatting Helpers
const formatDateTime = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Invalid Date";
  }
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    Pending:
      "bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border-yellow-300",
    Resolved:
      "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300",
    Rejected:
      "bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border-red-300",
  };
  return (
    colors[status] ||
    "bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-300"
  );
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "Pending":
      return <AlertCircle className="w-5 h-5" />;
    case "Resolved":
      return <CheckCircle className="w-5 h-5" />;
    case "Rejected":
      return <XCircle className="w-5 h-5" />;
    default:
      return <MessageSquare className="w-5 h-5" />;
  }
};

// Query Detail Modal
const QueryDetailModal: React.FC<{
  query: Query;
  onClose: () => void;
  onResolve: (queryId: string, status: string, notes: string) => Promise<void>;
}> = ({ query, onClose, onResolve }) => {
  const [resolving, setResolving] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(query.Status);
  const [resolutionNotes, setResolutionNotes] = useState(
    query.ResolutionNotes || ""
  );
  const [statusMessage, setStatusMessage] = useState("");

  const [attendanceDetails, setAttendanceDetails] =
    useState<AttendanceRecord | null>(null);
  const [attendanceLoading, setAttendanceLoading] = useState(true);

  const fetchAttendanceDetails = useCallback(async (attendanceId: string) => {
    setAttendanceLoading(true);
    // Use the new endpoint: /record/:attendanceId
    const url = `${API_BASE_URL}/record/${attendanceId}`;
    console.log("🤣Fetching attendance details from:", url);
    try {
      const res = await fetchData(url);
      if (res.ok && res.data.record) {
        // Check for res.data.record from the controller response
        setAttendanceDetails(res.data.record);
      } else {
        console.error("Failed to fetch attendance details:", res.data.message);
        setAttendanceDetails(null);
      }
    } catch (error) {
      console.error("Network error fetching attendance:", error);
      setAttendanceDetails(null);
    } finally {
      setAttendanceLoading(false);
    }
  }, []);

  useEffect(() => {
    if (query.AttendanceId) {
      fetchAttendanceDetails(query.AttendanceId);
    } else {
      setAttendanceDetails(null);
      setAttendanceLoading(false);
    }
  }, [query.AttendanceId, fetchAttendanceDetails]);
  // === END NEW ATTENDANCE LOGIC ===

  const handleResolve = async () => {
    if (selectedStatus === "Pending") {
      setStatusMessage(
        "⚠️ Please select a resolution status (Resolved or Rejected)"
      );
      return;
    }

    if (!resolutionNotes.trim()) {
      setStatusMessage("⚠️ Please provide resolution notes");
      return;
    }

    setResolving(true);
    setStatusMessage("Processing...");

    try {
      await onResolve(query.QueryId, selectedStatus, resolutionNotes);
      setStatusMessage("✅ Query resolved successfully!");
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      setStatusMessage("❌ Failed to resolve query. Please try again.");
    } finally {
      setResolving(false);
    }
  };

  const isAlreadyResolved = query.Status !== "Pending";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            {getStatusIcon(query.Status)}
            <h2 className="text-2xl font-bold">Query Details</h2>
          </div>
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 ${getStatusColor(
              query.Status
            )} mt-2`}
          >
            <span className="font-bold text-sm">{query.Status}</span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Query Information */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-xl border-2 border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Query ID</p>
                <p className="font-mono text-sm text-gray-800">
                  {query.QueryId}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Raised At</p>
                <p className="text-sm text-gray-800 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatDateTime(query.RaisedAt)}
                </p>
              </div>
              {query.FullName && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Employee Name</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {query.FullName}
                  </p>
                </div>
              )}
              {query.StaffId && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Staff ID</p>
                  <p className="text-sm font-mono text-gray-800">
                    {query.StaffId}
                  </p>
                </div>
              )}
            </div>
          </div>

          {query.AttendanceId && (
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl border-2 border-blue-200">
              <h4 className="text-lg font-bold text-blue-800 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Linked Attendance Record
              </h4>
              {attendanceLoading ? (
                <div className="text-blue-700 flex items-center gap-2 p-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Fetching attendance record...
                </div>
              ) : attendanceDetails ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="col-span-2 md:col-span-4">
                    <p className="text-sm text-blue-700 mb-1">Work Date</p>
                    <p className="text-xl font-bold text-gray-800">
                      {new Date(attendanceDetails.WorkDate).toLocaleDateString(
                        "en-IN",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700 mb-1">Check-In</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {attendanceDetails.CheckInAt
                        ? formatDateTime(attendanceDetails.CheckInAt).split(
                            ", "
                          )[1] // Gets time part
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700 mb-1">Check-Out</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {attendanceDetails.CheckOutAt
                        ? formatDateTime(attendanceDetails.CheckOutAt).split(
                            ", "
                          )[1]
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700 mb-1">Break-In</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {attendanceDetails.BreakInAt
                        ? formatDateTime(attendanceDetails.BreakInAt).split(
                            ", "
                          )[1]
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700 mb-1">Break-Out</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {attendanceDetails.BreakOutAt
                        ? formatDateTime(attendanceDetails.BreakOutAt).split(
                            ", "
                          )[1]
                        : "—"}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-red-700 p-2">
                  ⚠️ Could not load attendance details for Attendance ID:{" "}
                  {query.AttendanceId}.
                </p>
              )}
            </div>
          )}
          {/* ========================================================== */}

          {/* Subject & Message */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Subject
              </label>
              <div className="bg-indigo-50 p-4 rounded-xl border-2 border-indigo-200">
                <p className="text-gray-800 font-semibold">{query.Subject}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Message
              </label>
              <div className="bg-purple-50 p-4 rounded-xl border-2 border-purple-200">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {query.Message}
                </p>
              </div>
            </div>
          </div>

          {/* Proof URL */}
          {query.ProofUrl && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Paperclip className="w-4 h-4" />
                Attached Proof
              </label>
              <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
                <a
                  href={query.ProofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-2 transition"
                >
                  <Eye className="w-4 h-4" />
                  View Attached Proof Document
                </a>
              </div>
            </div>
          )}

          {/* Existing Resolution (if already resolved) */}
          {isAlreadyResolved && query.ResolutionNotes && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Previous Resolution
              </label>
              <div className="bg-green-50 p-4 rounded-xl border-2 border-green-300">
                <p className="text-sm text-gray-600 mb-1">
                  Resolved By: {query.ResolvedBy || "System"}
                </p>
                <p className="text-gray-800 mt-2">{query.ResolutionNotes}</p>
              </div>
            </div>
          )}

          {/* Resolution Section */}
          <div className="border-t-2 border-gray-200 pt-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Send className="w-5 h-5 text-indigo-600" />
              {isAlreadyResolved ? "Update Resolution" : "Resolve Query"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Resolution Status *
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  disabled={resolving}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                >
                  <option value="Pending">Pending</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Resolution Notes *
                </label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Provide detailed resolution notes..."
                  rows={5}
                  disabled={resolving}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all duration-300"
                />
              </div>

              {statusMessage && (
                <div
                  className={`p-4 rounded-xl font-medium ${
                    statusMessage.includes("✅")
                      ? "bg-green-100 text-green-800"
                      : statusMessage.includes("❌")
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {statusMessage}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={handleResolve}
                  disabled={resolving}
                  variant="success"
                  className="flex-1"
                >
                  {resolving ? (
                    <span className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Submit Resolution
                    </span>
                  )}
                </Button>
                <Button
                  onClick={onClose}
                  variant="secondary"
                  disabled={resolving}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Component
export default function QueryResolutionPortal() {
  const [queries, setQueries] = useState<Query[]>([]);
  const [filteredQueries, setFilteredQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedQuery, setSelectedQuery] = useState<Query | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const fetchQueries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchData(`${API_BASE_URL}/query/all`);
      if (res.ok) {
        const historyData = res.data.queries || res.data.history || [];
        const queryList = Array.isArray(historyData)
          ? historyData
          : [historyData];
        setQueries(queryList.filter(Boolean)); // filter out undefined/null
        setFilteredQueries(queryList.filter(Boolean));
      } else {
        console.error("Failed to fetch queries:", res.data.message);
        setQueries([]);
        setFilteredQueries([]);
      }
    } catch (error) {
      console.error("Network error fetching queries:", error);
      setQueries([]);
      setFilteredQueries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueries();
  }, [fetchQueries]);

  // Filter queries based on search and status
  useEffect(() => {
    let filtered = queries;

    if (statusFilter !== "All") {
      filtered = filtered.filter((q) => q.Status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (q) =>
          q.Subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.Message.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.QueryId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.UserName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.UserStaffId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredQueries(filtered);
  }, [searchTerm, statusFilter, queries]);

  const handleResolveQuery = async (
    queryId: string,
    status: string,
    notes: string
  ) => {
    const res = await patchData(`${API_BASE_URL}/query/${queryId}/resolve`, {
      status,
      resolutionNotes: notes,
    });

    if (res.ok) {
      await fetchQueries();
    } else {
      throw new Error(res.data.message || "Failed to resolve query");
    }
  };

  const stats = {
    total: queries.length,
    pending: queries.filter((q) => q.Status === "Pending").length,
    resolved: queries.filter((q) => q.Status === "Resolved").length,
    rejected: queries.filter((q) => q.Status === "Rejected").length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 border border-indigo-100">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
                <MessageSquare className="w-8 h-8 text-indigo-600" />
                Query Resolution Portal
              </h1>
              <p className="text-gray-600 mt-2">
                Manage and resolve staff queries efficiently
              </p>
            </div>
            <Button
              onClick={fetchQueries}
              disabled={loading}
              variant="secondary"
            >
              <RefreshCw
                className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">
                  Total Queries
                </p>
                <p className="text-4xl font-bold mt-2">{stats.total}</p>
              </div>
              <MessageSquare className="w-12 h-12 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium">Pending</p>
                <p className="text-4xl font-bold mt-2">{stats.pending}</p>
              </div>
              <AlertCircle className="w-12 h-12 text-yellow-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Resolved</p>
                <p className="text-4xl font-bold mt-2">{stats.resolved}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-pink-600 text-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">Rejected</p>
                <p className="text-4xl font-bold mt-2">{stats.rejected}</p>
              </div>
              <XCircle className="w-12 h-12 text-red-200" />
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by subject, message, query ID, staff name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="text-gray-500 w-5 h-5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Resolved">Resolved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Query List */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-indigo-600" />
            Query List ({filteredQueries.length})
          </h2>

          {loading ? (
            <div className="text-gray-500 flex flex-col items-center justify-center p-12">
              <RefreshCw className="w-12 h-12 animate-spin mb-4 text-indigo-600" />
              <span className="text-lg">Loading queries...</span>
            </div>
          ) : filteredQueries.length === 0 ? (
            <div className="text-gray-500 flex flex-col items-center justify-center p-12">
              <AlertCircle className="w-12 h-12 mb-4 text-gray-400" />
              <p className="text-lg">
                No queries found matching your criteria.
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {filteredQueries.map((query) => (
                <div
                  key={query.QueryId}
                  onClick={() => setSelectedQuery(query)}
                  className="bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 rounded-xl p-5 shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] cursor-pointer"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        {getStatusIcon(query.Status)}
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-800 text-lg mb-1">
                            {query.Subject}
                          </h3>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {query.Message}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                        {query.UserName && (
                          <span className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full">
                            <User className="w-3 h-3" />
                            {query.UserName}
                          </span>
                        )}
                        {query.UserStaffId && (
                          <span className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full font-mono">
                            ID: {query.UserStaffId}
                          </span>
                        )}
                        <span className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full">
                          <Clock className="w-3 h-3" />
                          {formatDateTime(query.RaisedAt)}
                        </span>
                        {query.ProofUrl && (
                          <span className="flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                            <Paperclip className="w-3 h-3" />
                            Has Proof
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`px-4 py-2 rounded-full text-xs font-bold border-2 ${getStatusColor(
                          query.Status
                        )} shadow-sm whitespace-nowrap`}
                      >
                        {query.Status}
                      </span>
                      {query.ResolutionNotes && (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Resolved
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedQuery && (
        <QueryDetailModal
          query={selectedQuery}
          onClose={() => setSelectedQuery(null)}
          onResolve={handleResolveQuery}
        />
      )}
    </div>
  );
}
