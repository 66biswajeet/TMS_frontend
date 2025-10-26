// "use client";
// import React, { useState, useEffect, useCallback, useMemo } from "react";
// import Link from "next/link";
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
//   Pencil,
//   ArrowRight,
//   BarChart,
//   ChevronLeft,
//   ChevronRight,
//   AlertCircle, // Icon for Late/OT
// } from "lucide-react";
// import {
//   LineChart,
//   Line,
//   BarChart as ReBarChart,
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
//   staffId?: string; // Added staffId
// }

// interface SummaryData {
//   totalEntries: number;
//   totalUsers: number;
//   totalWorkHours: string;
// }

// // UPDATED TYPE
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
//   LateMinutes: number | null; // <-- NEW
//   OvertimeMinutes: number | null; // <-- NEW
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
//   return response.json();
// };

// const formatDate = (date: Date) => date.toISOString().split("T")[0];

// const formatTime = (dateTime: string | null): string => {
//   if (!dateTime) return "—";
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

// const formatHoursDecimal = (hours: number | null): string => {
//   // Renamed original formatHours
//   if (hours === null || typeof hours === "undefined") return "—";
//   return hours.toFixed(2);
// };

// // NEW: Helper to format minutes to "Hh Mm"
// const minutesToHoursMinutes = (minutes: number | null | undefined): string => {
//   if (
//     minutes === null ||
//     typeof minutes === "undefined" ||
//     isNaN(minutes) ||
//     minutes <= 0
//   ) {
//     return ""; // Return empty string if no minutes or invalid
//   }
//   const h = Math.floor(minutes / 60);
//   const m = Math.round(minutes % 60);
//   let result = "";
//   if (h > 0) result += `${h}h `;
//   if (m > 0) result += `${m}m`;
//   return result.trim(); // Trim potential trailing space
// };

// // --- RE-CREATED CHILD COMPONENTS ---

// // Summary Card Component
// const SummaryCard: React.FC<{
//   title: string;
//   value: string | number;
//   icon: React.ElementType;
// }> = ({ title, value, icon: Icon }) => (
//   <div className="flex-1 p-5 bg-white rounded-xl shadow-lg border border-gray-200 flex items-center gap-4">
//     <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
//       <Icon className="w-6 h-6" />
//     </div>
//     <div>
//       <p className="text-sm font-medium text-gray-500">{title}</p>
//       <p className="text-2xl font-bold text-gray-900">{value}</p>
//     </div>
//   </div>
// );

// // UPDATED Attendance Detail Modal Component
// const AttendanceDetailModal: React.FC<{
//   record: DetailedAttendanceRecord;
//   allRecords: DetailedAttendanceRecord[];
//   onClose: () => void;
// }> = ({ record, allRecords, onClose }) => {
//   const [currentIndex, setCurrentIndex] = useState(() =>
//     allRecords.findIndex((r) => r.AttendanceId === record.AttendanceId)
//   );

//   const currentRecord = allRecords[currentIndex] || record;

//   const navigate = (direction: "next" | "prev") => {
//     if (direction === "next" && currentIndex < allRecords.length - 1) {
//       setCurrentIndex(currentIndex + 1);
//     } else if (direction === "prev" && currentIndex > 0) {
//       setCurrentIndex(currentIndex - 1);
//     }
//   };

//   const DetailRow: React.FC<{
//     label: string;
//     value: React.ReactNode; // Allow JSX for value
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

//   // Format Late/OT status for the modal
//   const lateStatus =
//     currentRecord.LateMinutes && currentRecord.LateMinutes > 0
//       ? `${currentRecord.LateMinutes}m Late`
//       : null;
//   const overtimeStatus =
//     currentRecord.OvertimeMinutes && currentRecord.OvertimeMinutes > 0
//       ? `${minutesToHoursMinutes(currentRecord.OvertimeMinutes)} OT`
//       : null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
//       <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
//         {/* Modal Header */}
//         <div className="flex items-center justify-between p-5 border-b bg-gray-50">
//           <div>
//             <h2 className="text-xl font-bold text-gray-900">
//               {currentRecord.FullName}
//             </h2>
//             <p className="text-sm text-gray-600">
//               {formatDate(new Date(currentRecord.WorkDate))}
//             </p>
//             {/* Display Late/OT in header */}
//             <div className="flex items-center gap-2 mt-1">
//               {lateStatus && (
//                 <span className="px-2 py-0.5 text-xs font-medium text-orange-800 bg-orange-100 rounded-full flex items-center gap-1">
//                   <AlertCircle className="w-3 h-3" /> {lateStatus}
//                 </span>
//               )}
//               {overtimeStatus && (
//                 <span className="px-2 py-0.5 text-xs font-medium text-purple-800 bg-purple-100 rounded-full flex items-center gap-1">
//                   <Clock className="w-3 h-3" /> {overtimeStatus}
//                 </span>
//               )}
//             </div>
//           </div>
//           <button
//             onClick={onClose}
//             className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition"
//           >
//             <X className="w-5 h-5" />
//           </button>
//         </div>

//         {/* Modal Content */}
//         <div className="p-6 overflow-y-auto">
//           <div className="flex flex-col md:flex-row gap-6">
//             {/* Selfie */}
//             <div className="flex-shrink-0 w-full md:w-48 h-48 bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center">
//               {currentRecord.SelfiePhotoUrl ? (
//                 <img
//                   src={currentRecord.SelfiePhotoUrl}
//                   alt="Selfie"
//                   className="w-full h-full object-cover"
//                 />
//               ) : (
//                 <span className="text-gray-500">No Selfie</span>
//               )}
//             </div>

//             {/* Details */}
//             <div className="flex-1">
//               <dl className="divide-y divide-gray-200">
//                 <DetailRow label="Staff ID" value={currentRecord.StaffId} />
//                 <DetailRow
//                   label="Branch"
//                   value={currentRecord.BranchName || "N/A"}
//                 />
//                 <DetailRow
//                   label="Position"
//                   value={currentRecord.PositionName || "N/A"}
//                 />
//                 <DetailRow
//                   label="Total Hours"
//                   value={`${formatHoursDecimal(
//                     currentRecord.WorkDurationHours
//                   )} hrs`}
//                   color="text-indigo-600"
//                 />
//                 {/* NEW Rows for Late/OT */}
//                 {currentRecord.LateMinutes && currentRecord.LateMinutes > 0 && (
//                   <DetailRow
//                     label="Late By"
//                     value={`${currentRecord.LateMinutes} min`}
//                     color="text-orange-600"
//                   />
//                 )}
//                 {currentRecord.OvertimeMinutes &&
//                   currentRecord.OvertimeMinutes > 0 && (
//                     <DetailRow
//                       label="Overtime"
//                       value={minutesToHoursMinutes(
//                         currentRecord.OvertimeMinutes
//                       )}
//                       color="text-purple-600"
//                     />
//                   )}
//               </dl>
//             </div>
//           </div>

//           {/* Timings */}
//           <div className="mt-6">
//             <h3 className="text-lg font-medium text-gray-900 mb-2">
//               Timestamps
//             </h3>
//             <dl className="divide-y divide-gray-200 border bg-gray-50/50 rounded-lg">
//               <DetailRow
//                 label="Check In"
//                 value={formatTime(currentRecord.CheckInAt)}
//                 color="text-green-600"
//               />
//               <DetailRow
//                 label="Break In"
//                 value={formatTime(currentRecord.BreakInAt)}
//               />
//               <DetailRow
//                 label="Break Out"
//                 value={formatTime(currentRecord.BreakOutAt)}
//               />
//               <DetailRow
//                 label="Check Out"
//                 value={formatTime(currentRecord.CheckOutAt)}
//                 color="text-red-600"
//               />
//             </dl>
//           </div>
//         </div>

//         {/* Modal Footer (Navigation) */}
//         <div className="flex items-center justify-between p-4 border-t bg-gray-50">
//           <button
//             onClick={() => navigate("prev")}
//             disabled={currentIndex === 0}
//             className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
//           >
//             <ChevronLeft className="w-4 h-4" />
//             Previous
//           </button>
//           <button
//             onClick={() => navigate("next")}
//             disabled={currentIndex === allRecords.length - 1}
//             className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
//           >
//             Next
//             <ChevronRight className="w-4 h-4" />
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// // --- MAIN COMPONENT ---
// const ManageAttendance = () => {
//   const [history, setHistory] = useState<DetailedAttendanceRecord[]>([]);
//   const [summary, setSummary] = useState<SummaryData | null>(null);
//   const [branches, setBranches] = useState<FilterOption[]>([]);
//   const [positions, setPositions] = useState<FilterOption[]>([]);

//   const [filters, setFilters] = useState({
//     branchId: "All Branches",
//     positionId: "All Positions",
//     startDate: formatDate(
//       new Date(new Date().setDate(new Date().getDate() - 7))
//     ),
//     endDate: formatDate(new Date()),
//     staffId: "",
//   });

//   const [isLoading, setIsLoading] = useState(false);
//   const [isFilterLoading, setIsFilterLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [selectedRecord, setSelectedRecord] =
//     useState<DetailedAttendanceRecord | null>(null);

//   const [userList, setUserList] = useState<UserSummary[]>([]);
//   const [isUserListLoading, setIsUserListLoading] = useState(false);

//   // --- Fetch Filter Options ---
//   const fetchFilterOptions = useCallback(async (endpoint: string) => {
//     try {
//       const fullResponse = await fetchApi(`/${endpoint}`);
//       const dataToMap = fullResponse.items || [];
//       return dataToMap.map((item: any) => ({
//         id: item.BranchId || item.PositionId || item.id,
//         name: item.BranchName || item.Name || item.name,
//       }));
//     } catch (error) {
//       console.error(`Failed to fetch /${endpoint}:`, error);
//       return [];
//     }
//   }, []);

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
//   }, [fetchFilterOptions]);

//   // --- Fetch User List ---
//   const loadUsers = useCallback(async () => {
//     setIsUserListLoading(true);
//     try {
//       const params = new URLSearchParams();
//       if (filters.branchId !== "All Branches")
//         params.append("branchId", filters.branchId);
//       if (filters.positionId !== "All Positions")
//         params.append("positionId", filters.positionId);
//       if (filters.staffId) params.append("staffId", filters.staffId);

//       const queryString = params.toString();
//       const data = await fetchApi(
//         `/users/minimal${queryString ? `?${queryString}` : ""}`
//       );
//       setUserList(data.items || []);
//     } catch (err: any) {
//       console.error("Failed to fetch user list:", err);
//       setUserList([]);
//     } finally {
//       setIsUserListLoading(false);
//     }
//   }, [filters.branchId, filters.positionId, filters.staffId]);

//   // --- Fetch Main Attendance Data ---
//   const fetchData = useCallback(async () => {
//     setIsLoading(true);
//     setError(null);
//     try {
//       const params = new URLSearchParams({
//         startDate: filters.startDate,
//         endDate: filters.endDate,
//       });
//       if (filters.branchId !== "All Branches")
//         params.append("branchId", filters.branchId);
//       if (filters.positionId !== "All Positions")
//         params.append("positionId", filters.positionId);
//       if (filters.staffId) params.append("staffId", filters.staffId);

//       const data = await fetchApi(`/attendance/history?${params.toString()}`);
//       // Use 'details' key based on controller response structure
//       setHistory(data.details || []);
//       setSummary(data.summary || null);
//     } catch (err: any) {
//       setError(err.message || "Failed to fetch attendance data.");
//       setHistory([]);
//       setSummary(null);
//     } finally {
//       setIsLoading(false);
//     }
//   }, [filters]);

//   useEffect(() => {
//     if (!isFilterLoading) {
//       fetchData();
//       loadUsers();
//     }
//   }, [fetchData, loadUsers, isFilterLoading]);

//   // --- Handlers ---
//   const handleFilterChange = (
//     e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
//   ) => {
//     const { name, value } = e.target;
//     setFilters((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleResetFilters = () => {
//     setFilters({
//       branchId: "All Branches",
//       positionId: "All Positions",
//       startDate: formatDate(
//         new Date(new Date().setDate(new Date().getDate() - 7))
//       ),
//       endDate: formatDate(new Date()),
//       staffId: "",
//     });
//   };

//   const handleRowClick = (record: DetailedAttendanceRecord) => {
//     setSelectedRecord(record);
//   };

//   // --- Filter Components ---
//   const FilterDropdown: React.FC<{
//     label: string;
//     name: "branchId" | "positionId";
//     options: FilterOption[];
//   }> = ({ label, name, options }) => (
//     <div className="flex-1 min-w-[150px]">
//       <label className="text-xs font-semibold text-gray-600 mb-1 block">
//         {label}
//       </label>
//       <select
//         name={name}
//         value={filters[name]}
//         onChange={handleFilterChange}
//         className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm focus:ring-indigo-500 focus:border-indigo-500"
//         disabled={isFilterLoading || isLoading}
//       >
//         <option value={`All ${label.split(" ")[2] || label}s`}>
//           All {label.split(" ")[2] || label}s
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
//         disabled={isLoading}
//       />
//     </div>
//   );

//   return (
//     <div className="p-6 md:p-10 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
//       <h1 className="text-4xl font-extrabold text-gray-900 mb-8 pb-2">
//         <Clock className="inline w-8 h-8 mr-3 text-purple-600" />
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
//         <div className="flex flex-col md:flex-row gap-4 items-end">
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
//           <DatePicker label="Start Date" name="startDate" />
//           <DatePicker label="End Date" name="endDate" />

//           <div className="flex-1 min-w-[150px]">
//             <label className="text-xs font-semibold text-gray-600 mb-1 block">
//               Filter by Staff ID
//             </label>
//             <input
//               type="text"
//               name="staffId"
//               value={filters.staffId}
//               onChange={handleFilterChange}
//               placeholder="Enter Staff ID..."
//               className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm focus:ring-indigo-500 focus:border-indigo-500"
//               disabled={isLoading || isFilterLoading}
//             />
//           </div>
//           <button
//             onClick={handleResetFilters}
//             className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm font-medium w-full md:w-auto"
//             disabled={isLoading}
//           >
//             Reset
//           </button>
//         </div>
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
//               Loading users...
//             </div>
//           ) : userList.length === 0 ? (
//             <div className="text-center py-4 text-gray-500">
//               No users found matching filters.
//             </div>
//           ) : (
//             <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
//               {userList.map((user) => (
//                 <li key={user.id}>
//                   <Link
//                     href={`/attendance-report/${user.id}`}
//                     target="_blank"
//                     className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition group"
//                   >
//                     <span className="text-sm font-medium text-gray-800 group-hover:text-indigo-700">
//                       {user.name}
//                     </span>
//                     <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition" />
//                   </Link>
//                 </li>
//               ))}
//             </ul>
//           )}
//         </div>
//       </div>

//       {/* --- Attendance Details Table --- */}
//       <div className="bg-white shadow-2xl rounded-2xl overflow-hidden border border-gray-200">
//         <h2 className="text-xl font-semibold p-6 border-b text-gray-800 flex items-center">
//           <Users className="w-5 h-5 mr-2 text-indigo-500" />
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
//                   Hours
//                 </th>
//                 {/* NEW COLUMN */}
//                 <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
//                   Status / Notes
//                 </th>
//                 <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
//                   Branch / Position
//                 </th>
//                 <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
//                   Selfie
//                 </th>
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {isLoading ? (
//                 <tr>
//                   <td colSpan={8} className="text-center py-12 text-indigo-600">
//                     <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
//                     <p className="text-sm">Loading attendance data...</p>
//                   </td>
//                 </tr>
//               ) : error ? (
//                 <tr>
//                   <td colSpan={8} className="text-center py-12 text-gray-500">
//                     <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-red-500" />
//                     <p className="text-red-700">Error: {error}</p>
//                   </td>
//                 </tr>
//               ) : history.length === 0 ? (
//                 <tr>
//                   <td colSpan={8} className="text-center py-12 text-gray-500">
//                     <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-yellow-500" />
//                     <p>No attendance records found for the selected filters.</p>
//                   </td>
//                 </tr>
//               ) : (
//                 history.map((record) => (
//                   <tr
//                     key={record.AttendanceId}
//                     className="hover:bg-indigo-50 cursor-pointer transition"
//                     onClick={() => handleRowClick(record)}
//                   >
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <div className="text-sm font-medium text-gray-900">
//                         {record.FullName}
//                       </div>
//                       <div className="text-xs text-gray-500">
//                         {record.StaffId}
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
//                       {formatDate(new Date(record.WorkDate))}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
//                       {formatTime(record.CheckInAt)}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">
//                       {formatTime(record.CheckOutAt)}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-700">
//                       {formatHoursDecimal(record.WorkDurationHours)}
//                     </td>
//                     {/* NEW TD for Status/Notes */}
//                     <td className="px-6 py-4 whitespace-nowrap text-xs">
//                       <div className="flex flex-col gap-1">
//                         {record.LateMinutes && record.LateMinutes > 0 && (
//                           <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 font-medium">
//                             <AlertCircle className="w-3 h-3" /> Late:{" "}
//                             {record.LateMinutes}m
//                           </span>
//                         )}
//                         {record.OvertimeMinutes &&
//                           record.OvertimeMinutes > 0 && (
//                             <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-medium">
//                               <Clock className="w-3 h-3" /> OT:{" "}
//                               {minutesToHoursMinutes(record.OvertimeMinutes)}
//                             </span>
//                           )}
//                         {/* Show nothing if both are 0/null */}
//                         {(!record.LateMinutes || record.LateMinutes <= 0) &&
//                           (!record.OvertimeMinutes ||
//                             record.OvertimeMinutes <= 0) && <span>-</span>}
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <div className="text-sm font-medium text-gray-900">
//                         {record.BranchName || "N/A"}
//                       </div>
//                       <div className="text-xs text-gray-500">
//                         {record.PositionName || "N/A"}
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       {record.SelfiePhotoUrl ? (
//                         <a
//                           href={record.SelfiePhotoUrl}
//                           target="_blank"
//                           rel="noopener noreferrer"
//                           className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
//                           onClick={(e) => e.stopPropagation()} // Prevent row click when clicking link
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

//       {/* --- Detail Modal --- */}
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

// // // //=========================================================//

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
  TrendingUp, // Keep for Summary Card
  Search, // Keep for Staff ID filter
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

// Keep SummaryData if keeping Summary Cards, otherwise remove
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
  // Removed 'history' and 'selectedRecord' state
  const [summary, setSummary] = useState<SummaryData | null>(null); // Keep if keeping cards
  const [branches, setBranches] = useState<FilterOption[]>([]);
  const [positions, setPositions] = useState<FilterOption[]>([]);

  const [filters, setFilters] = useState({
    branchId: "", // Default to empty string for "All Branches"
    positionId: "", // Default to empty string for "All Positions"
    startDate: formatDateForInput(
      new Date(new Date().setDate(new Date().getDate() - 7))
    ),
    endDate: formatDateForInput(new Date()),
    staffId: "",
  });

  // Removed 'isLoading' related to main table data
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [error, setError] = useState<string | null>(null); // Keep error for user list loading

  const [userList, setUserList] = useState<UserSummary[]>([]);
  const [isUserListLoading, setIsUserListLoading] = useState(false);

  // --- Fetch Filter Options ---
  const fetchFilterOptions = useCallback(async (endpoint: string) => {
    // ... (fetchFilterOptions logic remains the same) ...
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
      setError(`Failed to load filter options (${endpoint})`); // Update error state
      return [];
    }
  }, []);

  useEffect(() => {
    const loadFilters = async () => {
      setIsFilterLoading(true);
      setError(null); // Clear previous errors
      const [branchList, positionList] = await Promise.all([
        fetchFilterOptions("branches"),
        fetchFilterOptions("positions"),
      ]);
      setBranches(branchList);
      setPositions(positionList);
      setIsFilterLoading(false);
    };
    loadFilters();
  }, [fetchFilterOptions]);

  // --- Fetch User List ---
  const loadUsers = useCallback(async () => {
    setIsUserListLoading(true);
    setError(null); // Clear previous errors specifically for user loading
    try {
      const params = new URLSearchParams();
      if (filters.branchId) params.append("branchId", filters.branchId);
      if (filters.positionId) params.append("positionId", filters.positionId);
      if (filters.staffId) params.append("staffId", filters.staffId);

      const queryString = params.toString();
      const url = `/users/minimal${queryString ? `?${queryString}` : ""}`;
      const data = await fetchApi(url);
      setUserList(data.items || []);
    } catch (err: any) {
      console.error("Failed to fetch user list:", err);
      setError(err.message || "Failed to load employee list."); // Set error state
      setUserList([]);
    } finally {
      setIsUserListLoading(false);
    }
  }, [filters.branchId, filters.positionId, filters.staffId]);

  // Removed 'fetchData' function

  // Update useEffect to only call loadUsers
  useEffect(() => {
    if (!isFilterLoading) {
      // fetchData(); // <-- REMOVED
      loadUsers();
    }
    // Removed fetchData from dependencies
  }, [loadUsers, isFilterLoading]);

  // --- Handlers ---
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

  // Removed 'handleRowClick' function

  // --- Filter Components ---
  const FilterDropdown: React.FC<{
    label: string;
    name: "branchId" | "positionId";
    options: FilterOption[];
  }> = ({ label, name, options }) => (
    // ... (FilterDropdown component remains the same) ...
    <div className="flex-1 min-w-[150px]">
      <label className="text-xs font-semibold text-gray-600 mb-1 block">
        {label}
      </label>
      <select
        name={name}
        value={filters[name]}
        onChange={handleFilterChange}
        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm focus:ring-indigo-500 focus:border-indigo-500 appearance-none pr-8"
        disabled={isFilterLoading || isUserListLoading} // Changed isLoading to isUserListLoading
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
    // ... (DatePicker component remains the same) ...
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
        disabled={isUserListLoading} // Changed isLoading to isUserListLoading
      />
    </div>
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
              disabled={isUserListLoading || isFilterLoading} // Use isUserListLoading
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
              disabled={isUserListLoading} // Use isUserListLoading
              title="Reset Filters"
            >
              {" "}
              Reset{" "}
            </button>
          </div>
        </div>
        {/* Display general error messages here */}
        {error && !isUserListLoading && (
          <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> {error}
          </div>
        )}
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

      {/* --- Attendance Details Table REMOVED --- */}

      {/* --- Detail Modal REMOVED --- */}
    </div>
  );
};

export default ManageAttendance;
