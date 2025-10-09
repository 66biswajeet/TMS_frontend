// "use client";
"use client";
import { useEffect, useState, useCallback, useMemo } from "react";

const OFFICE_RADIUS_METERS = 100;
const API_BASE_URL = "http://localhost:5050/attendance";

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface AttendanceRecord {
  WorkDate: string; // Date of the record
  CheckInAt: string | null;
  CheckOutAt: string | null;
  // Add other fields you expect, like ID for history
  id?: string;
}

// --- MOCK UI COMPONENTS (Using native elements and Tailwind) ---
const Button = ({
  children,
  onClick,
  disabled = false,
  variant = "primary",
  className = "",
}: any) => {
  let baseStyle =
    "px-4 py-2 font-semibold rounded-lg transition duration-300 shadow-md";
  if (variant === "secondary") {
    baseStyle += " bg-gray-200 text-gray-800 hover:bg-gray-300";
  } else {
    baseStyle += " bg-indigo-600 text-white hover:bg-indigo-700";
  }
  if (disabled) {
    baseStyle =
      "px-4 py-2 font-semibold rounded-lg transition duration-300 bg-gray-400 text-gray-200 cursor-not-allowed";
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

// Mock Lucide Icons (assuming they are available in the environment)
const Clock = (props: any) => (
  <svg
    {...props}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);
const Calendar = (props: any) => (
  <svg
    {...props}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);
const CheckCircle = (props: any) => (
  <svg
    {...props}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);
const XCircle = (props: any) => (
  <svg
    {...props}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);
const RefreshCw = (props: any) => (
  <svg
    {...props}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 4v5h.582m15.356-2A8.995 8.995 0 0120.9 9H20a9 9 0 00-18 0h1.01a7.973 7.973 0 0115.356-2.981L16 9m-4 5l3-3m-3 3l-3-3m3 3V7"
    />
  </svg>
);

// --- GEOLIB REPLACEMENT (Haversine Formula for distance) ---

const getDistanceInMeters = (start: Coordinates, end: Coordinates): number => {
  const R = 6371000; // Radius of Earth in meters
  const lat1 = start.latitude;
  const lon1 = start.longitude;
  const lat2 = end.latitude;
  const lon2 = end.longitude;

  const toRad = (angle: number) => (Math.PI / 180) * angle;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

// --- API HELPERS ---

const postData = async (url: string, data: any) => {
  const token = localStorage.getItem("token");
  const response = await fetch(url, {
    method: "POST",
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

const fetchData = async (url: string) => {
  const token = localStorage.getItem("token");
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

// --- FORMATTING HELPERS ---

// Helper function to format UTC ISO string to readable local time (H:mm A)
const formatTime = (isoString: string | null): string => {
  if (!isoString) return "—";
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "Invalid Time";
  }
};

// Helper function to format UTC ISO string to readable date (Mon, Oct 7)
const formatDate = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-IN", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "Invalid Date";
  }
};

// Helper function to calculate duration in HH:mm format
const calculateDuration = (
  checkIn: string | null,
  checkOut: string | null
): string => {
  if (!checkIn) return "00:00";
  try {
    const inTime = new Date(checkIn).getTime();
    const outTime = checkOut ? new Date(checkOut).getTime() : Date.now();

    if (outTime < inTime) return "Error"; // Should not happen

    const diffMs = outTime - inTime;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    const pad = (num: number) => num.toString().padStart(2, "0");

    return `${pad(hours)}:${pad(minutes)}`;
  } catch {
    return "Error";
  }
};

// ===============================================

export default function AttendancePage() {
  // STATE FOR ATTENDANCE RECORD
  const [record, setRecord] = useState<AttendanceRecord | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);

  // STATE FOR GEO-LOCATION AND STATUS
  const [officeLocation, setOfficeLocation] = useState<Coordinates | null>(
    null
  );
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [locationStatus, setLocationStatus] = useState<string>(
    "Initializing location checks..."
  );
  const [isButtonDisabled, setIsButtonDisabled] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // --- API FUNCTIONS ---

  const fetchAttendanceRecord = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchData(`${API_BASE_URL}/my`);
      if (res.ok) {
        // Assuming your endpoint returns { record: {...} }
        setRecord(res.data.record || null);
      } else {
        console.error("Failed to fetch attendance record:", res.data.message);
        setRecord(null);
      }
    } catch (error) {
      console.error("Network error fetching record:", error);
      setRecord(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAttendanceHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      // NOTE: Assuming history endpoint returns a 'record' array field, as suggested by console.log in original code
      const res = await fetchData(`${API_BASE_URL}/history`);
      console.log("history called");
      //   if (res.ok) {
      //     console.log("if condition");
      //     const records = res.data.record;
      //     console.log(res.data);
      //     // records.sort(
      //     //   (a, b) =>
      //     //     new Date(b.WorkDate).getTime() - new Date(a.WorkDate).getTime()
      //     // );

      //     setHistory(records);

      //     console.log("his", history);
      //   } else {
      //     console.error("Failed to fetch attendance history:", res.data.message);
      //     setHistory([]);
      //   }
      // }

      if (res.ok) {
        const recordData = res.data.record;
        const records = Array.isArray(recordData) ? recordData : [recordData]; // ensures always an array

        records.sort(
          (a, b) =>
            new Date(b.WorkDate).getTime() - new Date(a.WorkDate).getTime()
        );

        setHistory(records);
        console.log("History records:", records);
      } else {
        console.error("Failed to fetch attendance history:", res.data.message);
        setHistory([]);
      }
    } catch (error) {
      console.error("Network error fetching history:", error);
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // --- EFFECTS ---

  // Initial Data Fetch (Today's record, history, and office location)
  useEffect(() => {
    fetchAttendanceRecord();
    fetchAttendanceHistory();

    const fetchOfficeLocation = async () => {
      setLocationStatus("Fetching office coordinates...");
      try {
        const res = await fetchData(`${API_BASE_URL}/office/location`);

        if (res.ok) {
          setLocationStatus(
            "Office coordinates received. Checking user GPS..."
          );
          setOfficeLocation({
            latitude: parseFloat(res.data.latitude),
            longitude: parseFloat(res.data.longitude),
          });
        } else {
          setLocationStatus(
            `Error: Could not fetch office location. Reason: ${
              res.data.message || res.status
            }`
          );
        }
      } catch (e) {
        setLocationStatus(
          "Network error fetching office location. Is the server running?"
        );
      }
    };
    fetchOfficeLocation();
  }, [fetchAttendanceRecord, fetchAttendanceHistory]);

  // Watch User Location and calculate distance
  useEffect(() => {
    if (!officeLocation) return;

    setLocationStatus("Office coordinates received. Checking user GPS...");

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const currentLoc = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setUserLocation(currentLoc);
        // Use the local getDistanceInMeters function
        const distance = getDistanceInMeters(currentLoc, officeLocation);
        const isTooFar = distance > OFFICE_RADIUS_METERS;
        setLocationStatus(
          isTooFar
            ? `Too Far: ${distance.toFixed(
                0
              )}m away. Radius: ${OFFICE_RADIUS_METERS}m`
            : `You are ${distance.toFixed(0)}m away. Ready for action!`
        );
        setIsButtonDisabled(isTooFar);
      },
      (err) => {
        setLocationStatus(`Location Error: ${err.message}.`);
        setIsButtonDisabled(true);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [officeLocation]);

  // --- BUTTON HANDLERS ---

  const handleCheckIn = useCallback(async () => {
    if (!userLocation || isProcessing) return;

    setIsProcessing(true);
    setLocationStatus("Sending check-in request...");

    try {
      const result = await postData(`${API_BASE_URL}/check-in`, {
        userLat: userLocation.latitude,
        userLong: userLocation.longitude,
      });

      if (result.ok) {
        setLocationStatus(`✅ Check-In Success! Fetching updated status...`);
        await fetchAttendanceRecord();
        await fetchAttendanceHistory();
      } else if (result.status === 403) {
        setLocationStatus(`❌ Check-In Failed: ${result.data.message}`);
      } else {
        setLocationStatus(
          `❌ Check-In Failed: ${result.data.message || "Server error."}`
        );
      }
    } catch (error) {
      setLocationStatus("Network error during check-in.");
    } finally {
      setIsProcessing(false);
    }
  }, [
    userLocation,
    isProcessing,
    fetchAttendanceRecord,
    fetchAttendanceHistory,
  ]);

  const handleCheckOut = useCallback(async () => {
    setIsProcessing(true);
    setLocationStatus("Sending check-out request...");
    try {
      const result = await postData(`${API_BASE_URL}/check-out`, {});

      if (result.ok) {
        setLocationStatus(`✅ Check-Out Success! Fetching updated status...`);
        await fetchAttendanceRecord();
        await fetchAttendanceHistory();
      } else {
        setLocationStatus(
          `❌ Check-Out Failed: ${result.data.message || "Server error."}`
        );
      }
    } catch (error) {
      setLocationStatus("Network error during check-out.");
    } finally {
      setIsProcessing(false);
    }
  }, [fetchAttendanceRecord, fetchAttendanceHistory]);

  const refreshAll = useCallback(() => {
    fetchAttendanceRecord();
    fetchAttendanceHistory();
  }, [fetchAttendanceRecord, fetchAttendanceHistory]);

  // --- DERIVED STATE ---
  const isCheckInBlocked =
    isProcessing || loading || isButtonDisabled || !!record?.CheckInAt;
  const isCheckOutBlocked =
    isProcessing || loading || !record?.CheckInAt || !!record?.CheckOutAt;

  const currentDuration = useMemo(() => {
    if (!record || !record.CheckInAt) return "00:00";
    return calculateDuration(record.CheckInAt, record.CheckOutAt);
  }, [record]);

  // --- RENDER ---
  return (
    <div className="p-4 space-y-6 max-w-lg mx-auto bg-white shadow-2xl rounded-xl border border-gray-100 font-sans">
      <h1 className="text-2xl font-extrabold text-indigo-700 border-b-4 border-indigo-100 pb-3 flex items-center gap-2">
        <Clock className="w-6 h-6" /> Employee Attendance Portal
      </h1>

      {/* Location Status */}
      <div className="text-sm p-3 bg-indigo-50 rounded-lg shadow-inner">
        <p className="font-medium text-indigo-700 mb-1">Live Location Check:</p>
        <span
          className={
            isButtonDisabled
              ? "text-red-600 font-bold text-base"
              : "text-green-600 font-bold text-base"
          }
        >
          {locationStatus}
        </span>
      </div>

      {/* Today's Status Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-lg">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-700">
          <Calendar className="w-5 h-5 text-indigo-500" /> Today's Record
        </h2>
        {loading ? (
          <div className="text-gray-500 flex items-center justify-center p-4">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading…
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-xs text-gray-500">Check-in</p>
              <p className="font-extrabold text-lg text-green-700 mt-1">
                {formatTime(record?.CheckInAt)}
              </p>
            </div>

            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-xs text-gray-500">Check-out</p>
              <p className="font-extrabold text-lg text-red-700 mt-1">
                {formatTime(record?.CheckOutAt)}
              </p>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-gray-500">Duration</p>
              <p className="font-extrabold text-lg text-blue-700 mt-1">
                {currentDuration}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={handleCheckIn}
          disabled={isCheckInBlocked}
          className="flex-1 py-3"
        >
          {isProcessing && !record?.CheckInAt ? "Checking In..." : "Check In"}
        </Button>

        <Button
          variant="secondary"
          onClick={handleCheckOut}
          disabled={isCheckOutBlocked}
          className="flex-1 py-3"
        >
          {isProcessing && record?.CheckInAt && !record?.CheckOutAt
            ? "Checking Out..."
            : "Check Out"}
        </Button>

        <Button
          variant="secondary"
          onClick={refreshAll}
          className="w-16 flex items-center justify-center"
          disabled={isProcessing || loading}
        >
          <RefreshCw
            className={`w-5 h-5 ${
              isProcessing || loading ? "animate-spin" : ""
            }`}
          />
        </Button>
      </div>

      {/* Attendance History */}
      <div className="mt-6">
        <h2 className="text-xl font-bold text-gray-700 mb-3 border-b pb-2">
          Recent Attendance History
        </h2>

        {historyLoading ? (
          <div className="text-gray-500 flex items-center justify-center p-4">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading History…
          </div>
        ) : history.length === 0 ? (
          <p className="text-gray-500 p-4 bg-gray-50 rounded-lg">
            No recent attendance records found.
          </p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {history.map((hist, index) => (
              <div
                key={hist.WorkDate || index}
                className="flex justify-between items-center p-3 bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition duration-200"
              >
                <div className="flex flex-col">
                  <span className="font-medium text-sm text-indigo-600">
                    {formatDate(hist.WorkDate)}
                  </span>
                  <span className="text-xs text-gray-400">
                    {calculateDuration(hist.CheckInAt, hist.CheckOutAt)} Total
                  </span>
                </div>
                <div className="flex space-x-4 text-sm">
                  <div className="text-green-600 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    {formatTime(hist.CheckInAt)}
                  </div>
                  <div
                    className={`font-semibold flex items-center gap-1 ${
                      hist.CheckOutAt ? "text-red-600" : "text-yellow-600"
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    {formatTime(hist.CheckOutAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// "use client";
// import { useEffect, useState, useCallback, useMemo } from "react";
// import { Button } from "@/components/ui/button";
// // REMOVED: import { getDistance } from "geolib";
// import { Clock, Calendar, CheckCircle, XCircle } from "lucide-react";

// // --- CONFIGURATION & TYPES ---
// const OFFICE_RADIUS_METERS = 100;
// const API_BASE_URL = "http://localhost:5050/attendance";

// interface Coordinates {
//   latitude: number;
//   longitude: number;
// }

// interface AttendanceRecord {
//   WorkDate: string; // Date of the record
//   CheckInAt: string | null;
//   CheckOutAt: string | null;
//   // Add other fields you expect
// }

// // --- GEOLIB REPLACEMENT (Haversine Formula for distance) ---

// /**
//  * Calculates the distance between two geographical points (in meters)
//  * using the Haversine formula.
//  * @param start - The starting coordinate {latitude, longitude}.
//  * @param end - The ending coordinate {latitude, longitude}.
//  * @returns Distance in meters.
//  */
// const getDistanceInMeters = (start: Coordinates, end: Coordinates): number => {
//   const R = 6371000; // Radius of Earth in meters
//   const lat1 = start.latitude;
//   const lon1 = start.longitude;
//   const lat2 = end.latitude;
//   const lon2 = end.longitude;

//   const toRad = (angle: number) => (Math.PI / 180) * angle;

//   const dLat = toRad(lat2 - lat1);
//   const dLon = toRad(lon2 - lon1);

//   const a =
//     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//     Math.cos(toRad(lat1)) *
//       Math.cos(toRad(lat2)) *
//       Math.sin(dLon / 2) *
//       Math.sin(dLon / 2);

//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

//   // Distance in meters
//   return R * c;
// };

// // --- API HELPERS (No change needed) ---

// const postData = async (url: string, data: any) => {
//   const token = localStorage.getItem("token");
//   const response = await fetch(url, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       ...(token && { Authorization: `Bearer ${token}` }),
//     },
//     body: JSON.stringify(data),
//   });
//   return {
//     data: await response.json().catch(() => ({ message: response.statusText })),
//     ok: response.ok,
//     status: response.status,
//   };
// };

// const fetchData = async (url: string) => {
//   const token = localStorage.getItem("token");
//   const response = await fetch(url, {
//     method: "GET",
//     headers: {
//       ...(token && { Authorization: `Bearer ${token}` }),
//     },
//   });
//   return {
//     data: await response.json().catch(() => ({ message: response.statusText })),
//     ok: response.ok,
//     status: response.status,
//   };
// };

// // ===============================================

// // Helper function to format UTC ISO string to readable local time (H:mm A)
// const formatTime = (isoString: string | null): string => {
//   if (!isoString) return "—";
//   try {
//     const date = new Date(isoString);
//     return date.toLocaleTimeString("en-IN", {
//       hour: "2-digit",
//       minute: "2-digit",
//       hour12: true,
//     });
//   } catch {
//     return "Invalid Time";
//   }
// };

// // Helper function to format UTC ISO string to readable date (Mon, Oct 7)
// const formatDate = (isoString: string): string => {
//   try {
//     const date = new Date(isoString);
//     return date.toLocaleDateString("en-IN", {
//       weekday: "short",
//       month: "short",
//       day: "numeric",
//     });
//   } catch {
//     return "Invalid Date";
//   }
// };

// export default function AttendancePage() {
//   // STATE FOR ATTENDANCE RECORD (Replaces Redux state)
//   const [record, setRecord] = useState<AttendanceRecord | null>(null);
//   const [history, setHistory] = useState<AttendanceRecord[]>([]); // NEW: History state
//   const [loading, setLoading] = useState<boolean>(true);
//   const [historyLoading, setHistoryLoading] = useState<boolean>(false); // NEW: History loading state

//   // STATE FOR GEO-LOCATION AND STATUS
//   const [officeLocation, setOfficeLocation] = useState<Coordinates | null>(
//     null
//   );
//   const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
//   const [locationStatus, setLocationStatus] = useState<string>(
//     "Initializing location checks..."
//   );
//   const [isButtonDisabled, setIsButtonDisabled] = useState<boolean>(true);
//   const [isProcessing, setIsProcessing] = useState<boolean>(false);

//   // --- API FUNCTIONS ---

//   // Function to fetch the user's current attendance record
//   const fetchAttendanceRecord = useCallback(async () => {
//     setLoading(true);
//     try {
//       const res = await fetchData(`${API_BASE_URL}/my`);
//       if (res.ok) {
//         setRecord(res.data.record || null);
//       } else {
//         console.error("Failed to fetch attendance record:", res.data.message);
//         setRecord(null);
//       }
//     } catch (error) {
//       console.error("Network error fetching record:", error);
//       setRecord(null);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   // Function to fetch attendance history
//   const fetchAttendanceHistory = useCallback(async () => {
//     setHistoryLoading(true);
//     try {
//       const res = await fetchData(`${API_BASE_URL}/history`);
//       if (res.ok) {
//         // Assuming this endpoint returns { history: [...] }
//         console.log(res.data.record);
//         setHistory(res.data.record || []);
//       } else {
//         console.error("Failed to fetch attendance history:", res.data.message);
//         setHistory([]);
//       }
//     } catch (error) {
//       console.error("Network error fetching history:", error);
//       setHistory([]);
//     } finally {
//       setHistoryLoading(false);
//     }
//   }, []);

//   // Initial Data Fetch (Today's record and office location)
//   useEffect(() => {
//     fetchAttendanceRecord();
//     fetchAttendanceHistory(); // Start history fetch

//     const fetchOfficeLocation = async () => {
//       setLocationStatus("Fetching office coordinates...");
//       try {
//         const res = await fetchData(`${API_BASE_URL}/office/location`);

//         if (res.ok) {
//           setLocationStatus(
//             "Office coordinates received. Checking user GPS..."
//           );
//           setOfficeLocation({
//             latitude: parseFloat(res.data.latitude),
//             longitude: parseFloat(res.data.longitude),
//           });
//         } else {
//           setLocationStatus(
//             `Error: Could not fetch office location. Reason: ${
//               res.data.message || res.status
//             }`
//           );
//         }
//       } catch (e) {
//         setLocationStatus(
//           "Network error fetching office location. Is the server running?"
//         );
//       }
//     };
//     fetchOfficeLocation();
//   }, [fetchAttendanceRecord, fetchAttendanceHistory]);

//   // Watch User Location and calculate distance
//   useEffect(() => {
//     if (!officeLocation) return;

//     setLocationStatus("Office coordinates received. Checking user GPS...");

//     const watchId = navigator.geolocation.watchPosition(
//       (position) => {
//         const currentLoc = {
//           latitude: position.coords.latitude,
//           longitude: position.coords.longitude,
//         };
//         setUserLocation(currentLoc);
//         // FIX: Use the local getDistanceInMeters function
//         const distance = getDistanceInMeters(currentLoc, officeLocation);
//         const isTooFar = distance > OFFICE_RADIUS_METERS;
//         setLocationStatus(
//           isTooFar
//             ? `Too Far: ${distance.toFixed(0)}m away.`
//             : `You are ${distance.toFixed(0)}m away. Ready.`
//         );
//         setIsButtonDisabled(isTooFar);
//       },
//       (err) => {
//         setLocationStatus(`Location Error: ${err.message}.`);
//         setIsButtonDisabled(true);
//       },
//       { enableHighAccuracy: true }
//     );

//     return () => navigator.geolocation.clearWatch(watchId);
//   }, [officeLocation]);

//   // --- Button Handlers ---
//   const handleCheckIn = useCallback(async () => {
//     if (!userLocation || isProcessing) return;

//     setIsProcessing(true);
//     setLocationStatus("Sending check-in request...");

//     try {
//       const result = await postData(`${API_BASE_URL}/check-in`, {
//         userLat: userLocation.latitude,
//         userLong: userLocation.longitude,
//       });

//       if (result.ok) {
//         setLocationStatus(`✅ Check-In Success! Fetching updated status...`);
//         // Refresh both today's record and history
//         await fetchAttendanceRecord();
//         await fetchAttendanceHistory();
//       } else if (result.status === 403) {
//         setLocationStatus(`❌ Check-In Failed: ${result.data.message}`);
//       } else {
//         setLocationStatus(
//           `❌ Check-In Failed: ${result.data.message || "Server error."}`
//         );
//       }
//     } catch (error) {
//       setLocationStatus("Network error during check-in.");
//     } finally {
//       setIsProcessing(false);
//     }
//   }, [
//     userLocation,
//     isProcessing,
//     fetchAttendanceRecord,
//     fetchAttendanceHistory,
//   ]);

//   const handleCheckOut = useCallback(async () => {
//     setIsProcessing(true);
//     setLocationStatus("Sending check-out request...");
//     try {
//       const result = await postData(`${API_BASE_URL}/check-out`, {});

//       if (result.ok) {
//         setLocationStatus(`✅ Check-Out Success! Fetching updated status...`);
//         // Refresh both today's record and history
//         await fetchAttendanceRecord();
//         await fetchAttendanceHistory();
//       } else {
//         setLocationStatus(
//           `❌ Check-Out Failed: ${result.data.message || "Server error."}`
//         );
//       }
//     } catch (error) {
//       setLocationStatus("Network error during check-out.");
//     } finally {
//       setIsProcessing(false);
//     }
//   }, [fetchAttendanceRecord, fetchAttendanceHistory]);

//   // Determine button state based on record and local geo-check
//   const isCheckInBlocked =
//     isProcessing || loading || isButtonDisabled || !!record?.CheckInAt;
//   const isCheckOutBlocked =
//     isProcessing || loading || !record?.CheckInAt || !!record?.CheckOutAt;

//   const refreshAll = useCallback(() => {
//     fetchAttendanceRecord();
//     fetchAttendanceHistory();
//   }, [fetchAttendanceRecord, fetchAttendanceHistory]);

//   return (
//     <div className="p-4 space-y-6 max-w-lg mx-auto bg-white shadow-xl rounded-xl">
//       <h1 className="text-2xl font-bold text-gray-800 border-b pb-2">
//         Employee Attendance Portal
//       </h1>

//       {/* Status & Live Check-in/out */}
//       <div className="space-y-4">
//         <div className="text-sm p-3 bg-indigo-100 rounded-lg shadow-inner">
//           <p className="font-medium text-indigo-700">Location Status:</p>
//           <span
//             className={
//               isButtonDisabled
//                 ? "text-red-700 font-bold"
//                 : "text-green-700 font-bold"
//             }
//           >
//             {locationStatus}
//           </span>
//         </div>

//         <div className="bg-white border rounded-lg p-4 shadow-md">
//           <h2 className="text-xl font-semibold mb-3 flex items-center gap-2 text-gray-700">
//             <Calendar className="w-5 h-5 text-indigo-500" /> Today's Status
//           </h2>
//           {loading ? (
//             <div className="text-gray-500">Loading today's record…</div>
//           ) : (
//             <div className="grid grid-cols-2 gap-4">
//               <div className="flex items-center gap-2">
//                 <CheckCircle className="w-5 h-5 text-green-500" />
//                 <div>
//                   <p className="text-sm text-gray-500">Check-in:</p>
//                   <p className="font-bold text-gray-800">
//                     {formatTime(record?.CheckInAt)}
//                   </p>
//                 </div>
//               </div>
//               <div className="flex items-center gap-2">
//                 <XCircle className="w-5 h-5 text-red-500" />
//                 <div>
//                   <p className="text-sm text-gray-500">Check-out:</p>
//                   <p className="font-bold text-gray-800">
//                     {formatTime(record?.CheckOutAt)}
//                   </p>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Action Buttons */}
//       <div className="flex flex-col sm:flex-row gap-3">
//         <Button
//           onClick={handleCheckIn}
//           disabled={isCheckInBlocked}
//           className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition duration-200"
//         >
//           {isProcessing ? "Processing..." : "Check In"}
//         </Button>

//         <Button
//           variant="secondary"
//           onClick={handleCheckOut}
//           disabled={isCheckOutBlocked}
//           className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 rounded-lg transition duration-200"
//         >
//           Check Out
//         </Button>

//         <Button
//           onClick={refreshAll}
//           variant="outline"
//           className="w-1/4 sm:w-auto text-gray-600 border-gray-300 hover:bg-gray-100"
//         >
//           Refresh
//         </Button>
//       </div>

//       {/* Attendance History */}
//       <div className="space-y-3 pt-4 border-t mt-6 border-gray-200">
//         <h2 className="text-xl font-semibold text-gray-800">
//           Attendance History
//         </h2>

//         {historyLoading ? (
//           <div className="text-gray-500">Loading history...</div>
//         ) : history.length === 0 ? (
//           <div className="text-gray-500 p-4 border rounded-lg">
//             No past attendance records found.
//           </div>
//         ) : (
//           <div className="space-y-2 max-h-60 overflow-y-auto">
//             {history.map((h) => (
//               <div
//                 key={h.WorkDate}
//                 className="flex justify-between items-center p-3 bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition duration-150"
//               >
//                 <div className="font-medium text-gray-800 w-1/4">
//                   {formatDate(h.WorkDate)}
//                 </div>
//                 <div className="flex items-center gap-1 text-sm text-gray-600 w-3/4 justify-end">
//                   <Clock className="w-4 h-4 text-indigo-400" />
//                   <span className="font-mono">{formatTime(h.CheckInAt)}</span>
//                   <span className="mx-2 text-gray-400">—</span>
//                   <span className="font-mono">{formatTime(h.CheckOutAt)}</span>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
