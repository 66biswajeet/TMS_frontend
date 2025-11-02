"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Loader2,
  Users,
  Clock,
  Filter,
  AlertTriangle,
  ArrowRight,
  BarChart,
  TrendingUp,
  Search,
} from "lucide-react";
// Removed X, MapPin, Calendar, Pencil, ChevronLeft, ChevronRight, AlertCircle, Recharts imports as they are no longer used

// --- CONFIGURATION ---
const API_BASE_URL = "http://localhost:5050";

// --- TYPES ---
interface HistoryFilterParams {
  branchId?: string;
  positionId?: string;
  startDate?: string;
  endDate?: string;
  staffId?: string;
}

// Keep SummaryData
interface SummaryData {
  totalEntries: number;
  totalUsers: number;
  totalWorkHours: string;
}

interface FilterOption {
  id: string;
  name: string;
}

interface UserSummary {
  id: string;
  name: string;
}

// ------------------------------------------------------------------
// ✅ NEW: useDebounce Custom Hook
// ------------------------------------------------------------------
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set a timeout to update the debounced value after the delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cancel the timeout if value changes (or component unmounts)
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// --- UTILITY FUNCTIONS ---
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
  // Try to parse JSON, return text if it fails but response was ok
  try {
    return await response.json();
  } catch (e) {
    if (response.ok) return null;
    throw new Error(`API Error: ${response.statusText}`);
  }
};

// Use YYYY-MM-DD format for date inputs
const formatDateForInput = (date: Date): string =>
  date.toISOString().split("T")[0];

// Format total work hours (needed for Summary Card if kept)
const formatHoursDecimal = (hours: number | null | string): string => {
  if (hours === null || typeof hours === "undefined") return "0.00"; // Default to 0.00
  const numHours = typeof hours === "string" ? parseFloat(hours) : hours;
  if (isNaN(numHours)) return "0.00"; // Default if parsing fails
  return numHours.toFixed(2);
};

// --- CHILD COMPONENTS ---

// Summary Card Component (Keep if keeping Summary Cards)
const SummaryCard: React.FC<{
  title: string;
  value: string | number | React.ReactNode; // Allow ReactNode for loader
  icon: React.ElementType;
}> = ({ title, value, icon: Icon }) => (
  <div className="flex-1 p-5 bg-white rounded-xl shadow-lg border border-gray-200 flex items-center gap-4 min-w-[200px]">
    <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

// --- MAIN COMPONENT ---
const ManageAttendance = () => {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [branches, setBranches] = useState<FilterOption[]>([]);
  const [positions, setPositions] = useState<FilterOption[]>([]);

  const [filters, setFilters] = useState({
    branchId: "",
    positionId: "",
    startDate: formatDateForInput(
      new Date(new Date().setDate(new Date().getDate() - 7))
    ),
    endDate: formatDateForInput(new Date()),
    staffId: "",
  });

  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [userList, setUserList] = useState<UserSummary[]>([]);
  const [isUserListLoading, setIsUserListLoading] = useState(false);

  // ------------------------------------------------------------------
  // ✅ DEBOUNCED FILTER VALUES
  // ------------------------------------------------------------------
  const debouncedBranchId = useDebounce(filters.branchId, 300);
  const debouncedPositionId = useDebounce(filters.positionId, 300);
  const debouncedStaffId = useDebounce(filters.staffId, 500); // Longer delay for text input

  // --- Fetch Filter Options (No Change) ---
  const fetchFilterOptions = useCallback(async (endpoint: string) => {
    try {
      const fullResponse = await fetchApi(`/${endpoint}`);
      const dataToMap = fullResponse.items || [];
      const optionsMap = new Map<string, string>();
      dataToMap.forEach((item: any) => {
        const id = item.BranchId || item.PositionId || item.id;
        const name = item.BranchName || item.Name || item.name;
        if (id && name && !optionsMap.has(id)) {
          optionsMap.set(id, name);
        }
      });
      return Array.from(optionsMap, ([id, name]) => ({ id, name }));
    } catch (error) {
      console.error(`Failed to fetch /${endpoint}:`, error);
      setError(`Failed to load filter options (${endpoint})`);
      return [];
    }
  }, []);

  // ------------------------------------------------------------------
  // ✅ UPDATED loadUsers: Uses debounced values as parameters and dependencies
  // ------------------------------------------------------------------
  const loadUsers = useCallback(async () => {
    setIsUserListLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();

      // ⬇️ USE DEBOUNCED VALUES ⬇️
      if (debouncedBranchId) params.append("branchId", debouncedBranchId);
      if (debouncedPositionId) params.append("positionId", debouncedPositionId);
      if (debouncedStaffId) params.append("staffId", debouncedStaffId);
      // ⬆️ END USE DEBOUNCED VALUES ⬆️

      const queryString = params.toString();
      // NOTE: This should point to the fast, minimal user endpoint
      const url = `/users/minimal${queryString ? `?${queryString}` : ""}`;
      const data = await fetchApi(url);
      setUserList(data.items || []);
    } catch (err: any) {
      console.error("Failed to fetch user list:", err);
      setError(err.message || "Failed to load employee list.");
      setUserList([]);
    } finally {
      setIsUserListLoading(false);
    }
    // ⬇️ DEPENDENCIES: Only trigger API call when debounced values settle ⬇️
  }, [debouncedBranchId, debouncedPositionId, debouncedStaffId]);

  // ------------------------------------------------------------------
  // ✅ UPDATED fetchSummaryData: Uses debounced values as parameters and dependencies
  // ------------------------------------------------------------------
  const fetchSummaryData = useCallback(async () => {
    setIsSummaryLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        // Date filters are fast, so they use immediate state
        startDate: filters.startDate,
        endDate: filters.endDate,
      });

      // ⬇️ USE DEBOUNCED VALUES ⬇️
      if (debouncedBranchId) params.append("branchId", debouncedBranchId);
      if (debouncedPositionId) params.append("positionId", debouncedPositionId);
      if (debouncedStaffId) params.append("staffId", debouncedStaffId);
      // ⬆️ END USE DEBOUNCED VALUES ⬆️

      const data = await fetchApi(`/attendance/history?${params.toString()}`);
      setSummary(data.summary || null);
    } catch (err: any) {
      setError(err.message || "Failed to fetch attendance summary.");
      setSummary(null);
    } finally {
      setIsSummaryLoading(false);
    }
    // ⬇️ DEPENDENCIES: Only trigger API call when date inputs or debounced values change ⬇️
  }, [
    filters.startDate,
    filters.endDate,
    debouncedBranchId,
    debouncedPositionId,
    debouncedStaffId,
  ]);

  // ------------------------------------------------------------------
  // ✅ UPDATED useEffect 1 (Initial Load & Parallel Filters)
  // ------------------------------------------------------------------
  useEffect(() => {
    const loadFilters = async () => {
      setIsFilterLoading(true);
      setError(null);
      // Load filters in parallel
      const [branchList, positionList] = await Promise.all([
        fetchFilterOptions("branches"),
        fetchFilterOptions("positions"),
      ]);
      setBranches(branchList);
      setPositions(positionList);
      setIsFilterLoading(false);
    };

    loadFilters();

    // ⬇️ ACTION 1: Load users and summary immediately (parallel with filters) ⬇️
    loadUsers();
    fetchSummaryData();
    // ⬆️ END ACTION 1 ⬆️
  }, [fetchFilterOptions]); // Removed loadUsers and fetchSummaryData from dependencies

  // ------------------------------------------------------------------
  // ✅ UPDATED useEffect 2 (Data Refresh on Filter Change)
  // ------------------------------------------------------------------
  useEffect(() => {
    // This hook runs whenever the debounced values settle,
    // triggering a refresh of the user list and summary cards.
    loadUsers();
    fetchSummaryData();
  }, [loadUsers, fetchSummaryData]); // Depend on the callbacks which are memoized by their debounced values

  // --- Handlers (Unchanged) ---
  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      branchId: "",
      positionId: "",
      startDate: formatDateForInput(
        new Date(new Date().setDate(new Date().getDate() - 7))
      ),
      endDate: formatDateForInput(new Date()),
      staffId: "",
    });
  };

  // --- Filter Components (Updated disabled prop) ---
  const FilterDropdown: React.FC<{
    label: string;
    name: "branchId" | "positionId";
    options: FilterOption[];
  }> = ({ label, name, options }) => (
    <div className="flex-1 min-w-[150px]">
      <label className="text-xs font-semibold text-gray-600 mb-1 block">
        {label}
      </label>
      <select
        name={name}
        value={filters[name]}
        onChange={handleFilterChange}
        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm focus:ring-indigo-500 focus:border-indigo-500 appearance-none pr-8"
        // ⬇️ UPDATED disabled prop ⬇️
        disabled={isFilterLoading || isUserListLoading || isSummaryLoading}
      >
        <option value="">
          All {label.includes("Branch") ? "Branches" : "Positions"}
        </option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </div>
  );

  const DatePicker: React.FC<{
    label: string;
    name: "startDate" | "endDate";
  }> = ({ label, name }) => (
    <div className="flex-1 min-w-[150px]">
      <label className="text-xs font-semibold text-gray-600 mb-1 block">
        {label}
      </label>
      <input
        type="date"
        name={name}
        value={filters[name]}
        onChange={handleFilterChange}
        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm focus:ring-indigo-500 focus:border-indigo-500"
        // ⬇️ UPDATED disabled prop ⬇️
        disabled={isUserListLoading || isSummaryLoading}
      />
    </div>
  );

  // Helper to display a loader in the Summary Card
  const LoaderValue = (
    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
  );

  return (
    <div className="p-6 md:p-10 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-8 pb-2 flex items-center">
        <Clock className="w-8 h-8 mr-3 text-purple-600" />
        Attendance Monitoring
      </h1>

      {/* --- Filter UI --- */}
      <div className="bg-white p-5 rounded-2xl shadow-lg mb-8 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <Filter className="w-5 h-5 mr-2 text-indigo-500" />
          Filter Data
          {isFilterLoading && (
            <Loader2 className="w-4 h-4 ml-3 animate-spin text-indigo-500" />
          )}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
          <div className="lg:col-span-1">
            <FilterDropdown
              label="Filter by Branch"
              name="branchId"
              options={branches}
            />
          </div>
          <div className="lg:col-span-1">
            <FilterDropdown
              label="Filter by Position"
              name="positionId"
              options={positions}
            />
          </div>
          <div className="lg:col-span-1">
            <label className="text-xs font-semibold text-gray-600 mb-1 block">
              {" "}
              Staff ID{" "}
            </label>
            <input
              type="text"
              name="staffId"
              value={filters.staffId}
              onChange={handleFilterChange}
              placeholder="Enter Staff ID..."
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              // ⬇️ UPDATED disabled prop ⬇️
              disabled={
                isUserListLoading || isFilterLoading || isSummaryLoading
              }
            />
          </div>
          <div className="lg:col-span-1">
            <DatePicker label="Start Date" name="startDate" />
          </div>
          <div className="lg:col-span-1">
            <DatePicker label="End Date" name="endDate" />
          </div>
          <div className="lg:col-span-1 flex items-end">
            <button
              onClick={handleResetFilters}
              className="w-full px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm font-medium flex items-center justify-center"
              // ⬇️ UPDATED disabled prop ⬇️
              disabled={isUserListLoading || isSummaryLoading}
              title="Reset Filters"
            >
              {" "}
              Reset{" "}
            </button>
          </div>
        </div>
        {/* Display general error messages here */}
        {error && !isUserListLoading && !isSummaryLoading && (
          <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> {error}
          </div>
        )}
      </div>

      {/* === SUMMARY CARDS SECTION === */}
      <div className="flex flex-wrap gap-4 mb-8">
        <SummaryCard
          title="Total Work Hours"
          icon={Clock}
          value={
            isSummaryLoading
              ? LoaderValue
              : `${formatHoursDecimal(summary?.totalWorkHours || 0)} hrs`
          }
        />
        <SummaryCard
          title="Total Entries"
          icon={TrendingUp}
          value={isSummaryLoading ? LoaderValue : summary?.totalEntries || 0}
        />
        <SummaryCard
          title="Total Users Tracked"
          icon={Users}
          value={isSummaryLoading ? LoaderValue : summary?.totalUsers || 0}
        />
      </div>

      {/* === EMPLOYEE REPORTS SECTION === */}
      <div className="bg-white p-5 rounded-2xl shadow-lg mb-8 border border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <BarChart className="w-5 h-5 mr-2 text-indigo-500" />
          Employee Reports
          {isUserListLoading && (
            <Loader2 className="w-4 h-4 ml-3 animate-spin text-indigo-500" />
          )}
        </h3>
        <div className="max-h-60 overflow-y-auto pr-2">
          {isUserListLoading ? (
            <div className="text-center py-4 text-gray-500">
              {" "}
              Loading users...{" "}
            </div>
          ) : !userList || userList.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              {" "}
              No users found matching filters.{" "}
            </div>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {userList.map((user) => (
                <li key={user.id}>
                  <Link
                    href={`/attendance-report/${user.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition group"
                  >
                    <span
                      className="text-sm font-medium text-gray-800 group-hover:text-indigo-700 truncate"
                      title={user.name}
                    >
                      {user.name || `User (${user.id.substring(0, 6)}...)`}
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition flex-shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageAttendance;

// // // // //=========================================================//

// "use client";
// import React, { useState, useEffect, useCallback } from "react";
// import Link from "next/link";
// import {
//   Loader2,
//   Users,
//   Clock,
//   Filter,
//   AlertTriangle,
//   ArrowRight,
//   BarChart,
//   TrendingUp, // Keep for Summary Card
//   Search, // Keep for Staff ID filter
// } from "lucide-react";
// // Removed X, MapPin, Calendar, Pencil, ChevronLeft, ChevronRight, AlertCircle, Recharts imports as they are no longer used

// // --- CONFIGURATION ---
// const API_BASE_URL = "http://localhost:5050";

// // --- TYPES ---
// interface HistoryFilterParams {
//   branchId?: string;
//   positionId?: string;
//   startDate?: string;
//   endDate?: string;
//   staffId?: string;
// }

// // Keep SummaryData if keeping Summary Cards, otherwise remove
// interface SummaryData {
//   totalEntries: number;
//   totalUsers: number;
//   totalWorkHours: string;
// }

// interface FilterOption {
//   id: string;
//   name: string;
// }

// interface UserSummary {
//   id: string;
//   name: string;
// }

// // --- UTILITY FUNCTIONS ---
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
//   // Try to parse JSON, return text if it fails but response was ok
//   try {
//     return await response.json();
//   } catch (e) {
//     if (response.ok) return null;
//     throw new Error(`API Error: ${response.statusText}`);
//   }
// };

// // Use YYYY-MM-DD format for date inputs
// const formatDateForInput = (date: Date): string =>
//   date.toISOString().split("T")[0];

// // Format total work hours (needed for Summary Card if kept)
// const formatHoursDecimal = (hours: number | null | string): string => {
//   if (hours === null || typeof hours === "undefined") return "0.00"; // Default to 0.00
//   const numHours = typeof hours === "string" ? parseFloat(hours) : hours;
//   if (isNaN(numHours)) return "0.00"; // Default if parsing fails
//   return numHours.toFixed(2);
// };

// // --- CHILD COMPONENTS ---

// // Summary Card Component (Keep if keeping Summary Cards)
// const SummaryCard: React.FC<{
//   title: string;
//   value: string | number | React.ReactNode; // Allow ReactNode for loader
//   icon: React.ElementType;
// }> = ({ title, value, icon: Icon }) => (
//   <div className="flex-1 p-5 bg-white rounded-xl shadow-lg border border-gray-200 flex items-center gap-4 min-w-[200px]">
//     <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
//       <Icon className="w-6 h-6" />
//     </div>
//     <div>
//       <p className="text-sm font-medium text-gray-500">{title}</p>
//       <p className="text-2xl font-bold text-gray-900">{value}</p>
//     </div>
//   </div>
// );

// // --- MAIN COMPONENT ---
// const ManageAttendance = () => {
//   // Removed 'history' and 'selectedRecord' state
//   const [summary, setSummary] = useState<SummaryData | null>(null); // Keep if keeping cards
//   const [branches, setBranches] = useState<FilterOption[]>([]);
//   const [positions, setPositions] = useState<FilterOption[]>([]);

//   const [filters, setFilters] = useState({
//     branchId: "", // Default to empty string for "All Branches"
//     positionId: "", // Default to empty string for "All Positions"
//     startDate: formatDateForInput(
//       new Date(new Date().setDate(new Date().getDate() - 7))
//     ),
//     endDate: formatDateForInput(new Date()),
//     staffId: "",
//   });

//   // Removed 'isLoading' related to main table data
//   const [isFilterLoading, setIsFilterLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null); // Keep error for user list loading

//   const [userList, setUserList] = useState<UserSummary[]>([]);
//   const [isUserListLoading, setIsUserListLoading] = useState(false);

//   // --- Fetch Filter Options ---
//   const fetchFilterOptions = useCallback(async (endpoint: string) => {
//     // ... (fetchFilterOptions logic remains the same) ...
//     try {
//       const fullResponse = await fetchApi(`/${endpoint}`);
//       const dataToMap = fullResponse.items || [];
//       const optionsMap = new Map<string, string>();
//       dataToMap.forEach((item: any) => {
//         const id = item.BranchId || item.PositionId || item.id;
//         const name = item.BranchName || item.Name || item.name;
//         if (id && name && !optionsMap.has(id)) {
//           optionsMap.set(id, name);
//         }
//       });
//       return Array.from(optionsMap, ([id, name]) => ({ id, name }));
//     } catch (error) {
//       console.error(`Failed to fetch /${endpoint}:`, error);
//       setError(`Failed to load filter options (${endpoint})`); // Update error state
//       return [];
//     }
//   }, []);

//   useEffect(() => {
//     const loadFilters = async () => {
//       setIsFilterLoading(true);
//       setError(null); // Clear previous errors
//       const [branchList, positionList] = await Promise.all([
//         fetchFilterOptions("branches"),
//         fetchFilterOptions("positions"),
//       ]);
//       setBranches(branchList);
//       setPositions(positionList);
//       setIsFilterLoading(false);
//     };
//     loadFilters();
//   }, [fetchFilterOptions]);

//   // --- Fetch User List ---
//   const loadUsers = useCallback(async () => {
//     setIsUserListLoading(true);
//     setError(null); // Clear previous errors specifically for user loading
//     try {
//       const params = new URLSearchParams();
//       if (filters.branchId) params.append("branchId", filters.branchId);
//       if (filters.positionId) params.append("positionId", filters.positionId);
//       if (filters.staffId) params.append("staffId", filters.staffId);

//       const queryString = params.toString();
//       const url = `/users/minimal${queryString ? `?${queryString}` : ""}`;
//       const data = await fetchApi(url);
//       setUserList(data.items || []);
//     } catch (err: any) {
//       console.error("Failed to fetch user list:", err);
//       setError(err.message || "Failed to load employee list."); // Set error state
//       setUserList([]);
//     } finally {
//       setIsUserListLoading(false);
//     }
//   }, [filters.branchId, filters.positionId, filters.staffId]);

//   // Removed 'fetchData' function

//   // Update useEffect to only call loadUsers
//   useEffect(() => {
//     if (!isFilterLoading) {
//       // fetchData(); // <-- REMOVED
//       loadUsers();
//     }
//     // Removed fetchData from dependencies
//   }, [loadUsers, isFilterLoading]);

//   // --- Handlers ---
//   const handleFilterChange = (
//     e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
//   ) => {
//     const { name, value } = e.target;
//     setFilters((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleResetFilters = () => {
//     setFilters({
//       branchId: "",
//       positionId: "",
//       startDate: formatDateForInput(
//         new Date(new Date().setDate(new Date().getDate() - 7))
//       ),
//       endDate: formatDateForInput(new Date()),
//       staffId: "",
//     });
//   };

//   // Removed 'handleRowClick' function

//   // --- Filter Components ---
//   const FilterDropdown: React.FC<{
//     label: string;
//     name: "branchId" | "positionId";
//     options: FilterOption[];
//   }> = ({ label, name, options }) => (
//     // ... (FilterDropdown component remains the same) ...
//     <div className="flex-1 min-w-[150px]">
//       <label className="text-xs font-semibold text-gray-600 mb-1 block">
//         {label}
//       </label>
//       <select
//         name={name}
//         value={filters[name]}
//         onChange={handleFilterChange}
//         className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm focus:ring-indigo-500 focus:border-indigo-500 appearance-none pr-8"
//         disabled={isFilterLoading || isUserListLoading} // Changed isLoading to isUserListLoading
//       >
//         <option value="">
//           All {label.includes("Branch") ? "Branches" : "Positions"}
//         </option>
//         {options.map((option) => (
//           <option key={option.id} value={option.id}>
//             {option.name}
//           </option>
//         ))}
//       </select>
//     </div>
//   );

//   const DatePicker: React.FC<{
//     label: string;
//     name: "startDate" | "endDate";
//   }> = ({ label, name }) => (
//     // ... (DatePicker component remains the same) ...
//     <div className="flex-1 min-w-[150px]">
//       <label className="text-xs font-semibold text-gray-600 mb-1 block">
//         {label}
//       </label>
//       <input
//         type="date"
//         name={name}
//         value={filters[name]}
//         onChange={handleFilterChange}
//         className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm focus:ring-indigo-500 focus:border-indigo-500"
//         disabled={isUserListLoading} // Changed isLoading to isUserListLoading
//       />
//     </div>
//   );

//   return (
//     <div className="p-6 md:p-10 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
//       <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-8 pb-2 flex items-center">
//         <Clock className="w-8 h-8 mr-3 text-purple-600" />
//         Attendance Monitoring
//       </h1>

//       {/* --- Filter UI --- */}
//       <div className="bg-white p-5 rounded-2xl shadow-lg mb-8 border border-gray-200">
//         <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
//           <Filter className="w-5 h-5 mr-2 text-indigo-500" />
//           Filter Data
//           {isFilterLoading && (
//             <Loader2 className="w-4 h-4 ml-3 animate-spin text-indigo-500" />
//           )}
//         </h3>
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
//           <div className="lg:col-span-1">
//             <FilterDropdown
//               label="Filter by Branch"
//               name="branchId"
//               options={branches}
//             />
//           </div>
//           <div className="lg:col-span-1">
//             <FilterDropdown
//               label="Filter by Position"
//               name="positionId"
//               options={positions}
//             />
//           </div>
//           <div className="lg:col-span-1">
//             <label className="text-xs font-semibold text-gray-600 mb-1 block">
//               {" "}
//               Staff ID{" "}
//             </label>
//             <input
//               type="text"
//               name="staffId"
//               value={filters.staffId}
//               onChange={handleFilterChange}
//               placeholder="Enter Staff ID..."
//               className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm focus:ring-indigo-500 focus:border-indigo-500"
//               disabled={isUserListLoading || isFilterLoading} // Use isUserListLoading
//             />
//           </div>
//           <div className="lg:col-span-1">
//             <DatePicker label="Start Date" name="startDate" />
//           </div>
//           <div className="lg:col-span-1">
//             <DatePicker label="End Date" name="endDate" />
//           </div>
//           <div className="lg:col-span-1 flex items-end">
//             <button
//               onClick={handleResetFilters}
//               className="w-full px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm font-medium flex items-center justify-center"
//               disabled={isUserListLoading} // Use isUserListLoading
//               title="Reset Filters"
//             >
//               {" "}
//               Reset{" "}
//             </button>
//           </div>
//         </div>
//         {/* Display general error messages here */}
//         {error && !isUserListLoading && (
//           <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm flex items-center gap-2">
//             <AlertTriangle className="w-4 h-4" /> {error}
//           </div>
//         )}
//       </div>

//       {/* === EMPLOYEE REPORTS SECTION === */}
//       <div className="bg-white p-5 rounded-2xl shadow-lg mb-8 border border-gray-200">
//         <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
//           <BarChart className="w-5 h-5 mr-2 text-indigo-500" />
//           Employee Reports
//           {isUserListLoading && (
//             <Loader2 className="w-4 h-4 ml-3 animate-spin text-indigo-500" />
//           )}
//         </h3>
//         <div className="max-h-60 overflow-y-auto pr-2">
//           {isUserListLoading ? (
//             <div className="text-center py-4 text-gray-500">
//               {" "}
//               Loading users...{" "}
//             </div>
//           ) : !userList || userList.length === 0 ? (
//             <div className="text-center py-4 text-gray-500">
//               {" "}
//               No users found matching filters.{" "}
//             </div>
//           ) : (
//             <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
//               {userList.map((user) => (
//                 <li key={user.id}>
//                   <Link
//                     href={`/attendance-report/${user.id}`}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition group"
//                   >
//                     <span
//                       className="text-sm font-medium text-gray-800 group-hover:text-indigo-700 truncate"
//                       title={user.name}
//                     >
//                       {user.name || `User (${user.id.substring(0, 6)}...)`}
//                     </span>
//                     <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition flex-shrink-0" />
//                   </Link>
//                 </li>
//               ))}
//             </ul>
//           )}
//         </div>
//       </div>

//       {/* --- Attendance Details Table REMOVED --- */}

//       {/* --- Detail Modal REMOVED --- */}
//     </div>
//   );
// };

// export default ManageAttendance;
