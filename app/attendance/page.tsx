"use client";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";

import {
  requestNotificationPermission,
  sendNotification,
} from "../../src/utils/notification.utils";

import CameraModal from "@/components/CameraCapture";

const OFFICE_RADIUS_METERS = 100;
const API_BASE_URL = "http://localhost:5050/attendance";
// Base URL for user-related config (where expected timings are)
const USER_API_BASE_URL = "http://localhost:5050/users";

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface AttendanceRecord {
  WorkDate: string;
  CheckInAt: string | null;
  CheckOutAt: string | null;
  BreakInAt: string | null;
  BreakOutAt: string | null;
  TotalBreakDuration: string | null;
  AttendanceId: number;
}

// Interface for Expected Timings
interface ExpectedTimings {
  UserId: string;
  ExpectedCheckIn: string; // HH:MM:SS
  ExpectedCheckOut: string; // HH:MM:SS
  ExpectedBreakIn: string | null; // HH:MM:SS or null
  ExpectedBreakOut: string | null; // HH:MM:SS or null
  OffDaysMask: number; // <-- ADD THIS LINE
}

interface Query {
  QueryId: string;
  UserId: string;
  Subject: string;
  Message: string;
  Proofurl: string | null;
  Status: string;
  RaisedAt: string;
  ResolutionNotes: string | null;
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
      " bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 hover:from-gray-200 hover:to-gray-300 hover:shadow-xl";
  } else if (variant === "success") {
    baseStyle +=
      " bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 hover:shadow-green-500/50";
  } else if (variant === "danger") {
    baseStyle +=
      " bg-gradient-to-r from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700 hover:shadow-red-500/50";
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

// Mock Icons with enhanced styling
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

const PencilIcon = (props: any) => (
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
      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
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

const MessageSquare = (props: any) => (
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
      d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
    />
  </svg>
);

const Paperclip = (props: any) => (
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
      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
    />
  </svg>
);

const MapPin = (props: any) => (
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
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

// Haversine Formula
const getDistanceInMeters = (start: Coordinates, end: Coordinates): number => {
  const R = 6371000;
  const toRad = (angle: number) => (Math.PI / 180) * angle;
  const dLat = toRad(end.latitude - start.latitude);
  const dLon = toRad(end.longitude - start.longitude);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(start.latitude)) *
      Math.cos(toRad(end.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// API Helpers
const postData = async (url: string, data: any) => {
  const token = window.localStorage?.getItem("token");
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

const patchData = async (url: string, data: any) => {
  const token = window.localStorage?.getItem("token");
  const response = await fetch(url, {
    method: "PATCH", // <--- Use PATCH method
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

// --- NEW HELPER FUNCTION ---
/**
 * Converts a full ISO timestamp (like 1970-01-01T23:20:15.000Z)
 * into a simple UTC time string (like 23:20:15).
 */
const formatTimestampToTime = (timestamp: string | null): string | null => {
  if (!timestamp) return null;
  try {
    const date = new Date(timestamp);
    // Use UTC methods because the timestamp is likely from a DB 'Time' type
    // serialized at UTC with a default 1970 date.
    const hours = date.getUTCHours().toString().padStart(2, "0");
    const minutes = date.getUTCMinutes().toString().padStart(2, "0");
    const seconds = date.getUTCSeconds().toString().padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  } catch (e) {
    console.error("Invalid timestamp received:", timestamp, e);
    return null; // Return null if parsing fails
  }
};
// --- END NEW HELPER FUNCTION ---

// Formatting Helpers
const formatTime = (isoString: string | null): string => {
  if (!isoString) return "—";
  // Check if it's a pure HH:MM:SS string (like from ExpectedTimings)
  if (isoString.match(/^\d{2}:\d{2}:\d{2}$/)) {
    try {
      // Construct a Date object for today to use toLocaleTimeString
      const [h, m, s] = isoString.split(":").map(Number);
      const date = new Date();
      date.setHours(h, m, s, 0);
      return date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return isoString.substring(0, 5); // Fallback to HH:MM if parsing fails
    }
  }

  // Standard ISO date string conversion
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "—";
  }
};

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

const calculateDuration = (
  checkIn: string | null,
  checkOut: string | null
): string => {
  if (!checkIn) return "00:00";
  try {
    const inTime = new Date(checkIn).getTime();
    const outTime = checkOut ? new Date(checkOut).getTime() : Date.now();
    if (outTime < inTime) return "Error";
    const diffMs = outTime - inTime;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const pad = (num: number) => num.toString().padStart(2, "0");
    return `${pad(hours)}:${pad(minutes)}`;
  } catch {
    return "Error";
  }
};

export default function AttendancePage() {
  const [record, setRecord] = useState<AttendanceRecord | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [officeLocation, setOfficeLocation] = useState<Coordinates | null>(
    null
  );
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [locationStatus, setLocationStatus] = useState<string>(
    "Initializing location checks..."
  );
  const [isButtonDisabled, setIsButtonDisabled] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [queries, setQueries] = useState<Query[]>([]);
  const [queriesLoading, setQueriesLoading] = useState<boolean>(false);
  const [querySubject, setQuerySubject] = useState<string>("");
  const [queryMessage, setQueryMessage] = useState<string>("");
  const [queryProofFile, setQueryProofFile] = useState<File | null>(null);
  const [isSubmittingQuery, setIsSubmittingQuery] = useState<boolean>(false);
  const [queryStatus, setQueryStatus] = useState<string>("");
  const [showQueryForm, setShowQueryForm] = useState<boolean>(false);

  const [showCameraModal, setShowCameraModal] = useState(false);

  // NEW STATE: Expected Timings
  const [expectedTimings, setExpectedTimings] =
    useState<ExpectedTimings | null>(null);
  const [isBeforeExpectedCheckIn, setIsBeforeExpectedCheckIn] =
    useState<boolean>(false);
  const [isAfterExpectedCheckOut, setIsAfterExpectedCheckOut] =
    useState<boolean>(false); //
  const [isBeforeExpectedCheckOut, setIsBeforeExpectedCheckOut] =
    useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const proofInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    const token = window.localStorage?.getItem("token");
    const formData = new FormData();
    formData.append("selfie", file);
    const response = await fetch(`${API_BASE_URL}/upload-selfie`, {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });
    return {
      data: await response
        .json()
        .catch(() => ({ message: response.statusText })),
      ok: response.ok,
      status: response.status,
    };
  };

  const getCurrentUserId = (): string | null => {
    if (typeof window !== "undefined" && window.localStorage) {
      const userJson = window.localStorage.getItem("user");
      if (userJson) {
        try {
          const userObject = JSON.parse(userJson);
          if (userObject && userObject.userId) {
            return userObject.userId;
          }
        } catch (e) {
          console.error("Failed to parse user JSON from localStorage.", e);
          return null;
        }
      }
      console.warn(
        "localStorage key 'user' is unavailable or improperly formatted."
      );
      return null;
    }
    return null;
  };

  // --- MODIFIED: This function now fetches AND formats timings ---
  const fetchExpectedTimings = useCallback(async () => {
    const currentUserId = getCurrentUserId();

    if (!currentUserId) {
      setExpectedTimings(null);
      console.error(
        "Cannot fetch configuration: User ID is unavailable on the client."
      );
      return;
    }

    try {
      // Use the /configuration endpoint
      const res = await fetchData(
        `${USER_API_BASE_URL}/${currentUserId}/configuration`
      );

      // --- THIS BLOCK IS MODIFIED TO FORMAT THE DATA ---
      if (res.ok && res.data && res.data.expectedTimings) {
        const timings = res.data.expectedTimings;

        // Re-format timestamps back to HH:MM:SS time strings
        const formattedTimings = {
          ...timings,
          ExpectedCheckIn: formatTimestampToTime(timings.ExpectedCheckIn),
          ExpectedCheckOut: formatTimestampToTime(timings.ExpectedCheckOut),
          ExpectedBreakIn: formatTimestampToTime(timings.ExpectedBreakIn),
          ExpectedBreakOut: formatTimestampToTime(timings.ExpectedBreakOut),
        };

        setExpectedTimings(
          formattedTimings.ExpectedCheckIn
            ? (formattedTimings as ExpectedTimings) // Set the formatted data
            : null
        );
      } else {
        console.error(
          `Fetch failed with status ${res.status}. Check user rank or if config exists.`
        );
        setExpectedTimings(null);
      }
    } catch (error) {
      console.error("Failed to fetch configuration:", error);
      setExpectedTimings(null);
    }
  }, []); // No dependencies needed here as getCurrentUserId is stable

  const fetchAttendanceRecord = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchData(`${API_BASE_URL}/my`);
      if (res.ok) {
        setRecord(res.data.record || null);
      } else {
        setRecord(null);
      }
    } catch (error) {
      setRecord(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAttendanceHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetchData(`${API_BASE_URL}/history`);
      if (res.ok) {
        const recordData = res.data.record;
        const records = Array.isArray(recordData) ? recordData : [recordData];
        records.sort(
          (a, b) =>
            new Date(b.WorkDate).getTime() - new Date(a.WorkDate).getTime()
        );
        setHistory(records);
      } else {
        setHistory([]);
      }
    } catch (error) {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const fetchQueries = useCallback(async () => {
    setQueriesLoading(true);
    try {
      const res = await fetchData(`${API_BASE_URL}/query/history`);
      if (res.ok) {
        const historyData = res.data.history;
        const queryList = Array.isArray(historyData)
          ? historyData
          : [historyData];
        setQueries(queryList);
      } else {
        setQueries([]);
      }
    } catch (error) {
      setQueries([]);
    } finally {
      setQueriesLoading(false);
    }
  }, []);

  useEffect(() => {
    requestNotificationPermission();
    fetchAttendanceRecord();
    fetchAttendanceHistory();
    fetchQueries();

    // This now fetches timings
    fetchExpectedTimings();

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
          setLocationStatus(`Error: Could not fetch office location.`);
        }
      } catch (e) {
        setLocationStatus("Network error fetching office location.");
      }
    };
    fetchOfficeLocation();
  }, [
    fetchAttendanceRecord,
    fetchAttendanceHistory,
    fetchQueries,
    fetchExpectedTimings,
  ]);

  useEffect(() => {
    if (!officeLocation) return;
    setLocationStatus("Office coordinates received. Checking user GPS...");
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        // --- ADD THIS LOG FOR DEBUGGING ---
        console.log("GPS Location Update:", position.coords);

        const currentLoc = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setUserLocation(currentLoc);
        const distance = getDistanceInMeters(currentLoc, officeLocation);
        const isTooFar = distance > OFFICE_RADIUS_METERS;
        setLocationStatus(
          isTooFar
            ? `Outside office range: ${distance.toFixed(0)}m away`
            : `Within range: ${distance.toFixed(0)}m from office`
        );
        setIsButtonDisabled(isTooFar);
      },
      (err) => {
        setLocationStatus(`Location Error: ${err.message}`);
        setIsButtonDisabled(true);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [officeLocation]);

  // This useEffect hook validates the time and sets blocking flags
  useEffect(() => {
    let notificationTimer: ReturnType<typeof setTimeout> | null = null;
    let validationTimer: ReturnType<typeof setTimeout> | null = null;

    // --- ADD THIS REGEX ---
    const timeRegex = /^\d{2}:\d{2}:\d{2}$/;

    const checkTime = () => {
      const now = new Date();
      console.log("--- Running checkTime ---", now.toLocaleTimeString());

      // --- THIS 'if' CONDITION IS NOW STRONGER ---
      if (
        !expectedTimings ||
        !timeRegex.test(expectedTimings.ExpectedCheckIn) ||
        !timeRegex.test(expectedTimings.ExpectedCheckOut)
      ) {
        console.log(
          "checkTime: Aborting. expectedTimings is null or time strings are not in HH:MM:SS format."
        );
        console.log("Received Timings:", expectedTimings); // Log what we received
        setIsBeforeExpectedCheckIn(false);
        setIsAfterExpectedCheckOut(false);
        setIsBeforeExpectedCheckOut(false);
        return;
      }

      console.log("checkTime: Valid expectedTimings found:", expectedTimings);

      const expectedInTimeStr = expectedTimings.ExpectedCheckIn;
      const expectedOutTimeStr = expectedTimings.ExpectedCheckOut;

      // --- Check In Date Calc ---
      const [inHours, inMinutes, inSeconds] = expectedInTimeStr
        .split(":")
        .map(Number);
      const expectedCheckInDate = new Date();
      expectedCheckInDate.setHours(inHours, inMinutes, inSeconds, 0);

      // --- Check Out Date Calc ---
      const [outHours, outMinutes, outSeconds] = expectedOutTimeStr
        .split(":")
        .map(Number);
      const expectedCheckOutDate = new Date();
      expectedCheckOutDate.setHours(outHours, outMinutes, outSeconds, 0);

      // --- Debugging Block ---
      console.log("===================================");
      console.log("Current Time:", now.toLocaleTimeString());
      console.log(
        "Expected Check-Out Time:",
        expectedCheckOutDate.toLocaleTimeString() // This should no longer be "Invalid Date"
      );
      console.log(
        "Is (Current Time > Expected Check-Out Time)?",
        now > expectedCheckOutDate
      );
      console.log("===================================");
      // --- End Debugging Block ---

      // Notification Scheduling Logic
      const timeUntilCheckInMs = expectedCheckInDate.getTime() - now.getTime();

      if (notificationTimer) {
        clearTimeout(notificationTimer);
        notificationTimer = null;
      }

      if (timeUntilCheckInMs > 5000 && !record?.CheckInAt) {
        notificationTimer = setTimeout(() => {
          sendNotification(
            "⏰ Time to Check In!",
            `Your shift starts now (${formatTime(
              expectedTimings.ExpectedCheckIn
            )}).`
          );
          checkTime();
        }, timeUntilCheckInMs);
      }

      // Validation Flags
      setIsBeforeExpectedCheckIn(now < expectedCheckInDate);
      setIsAfterExpectedCheckOut(now > expectedCheckOutDate); // <-- This is the key flag
      setIsBeforeExpectedCheckOut(now < expectedCheckOutDate);

      validationTimer = setTimeout(checkTime, 10000);
    };

    const initialTimer = setTimeout(checkTime, 100);

    return () => {
      clearTimeout(initialTimer);
      if (validationTimer) clearTimeout(validationTimer);
      if (notificationTimer) clearTimeout(notificationTimer);
    };
  }, [expectedTimings, record?.CheckInAt]);

  ///========================================================
  // --- NEW: Off day check using OffDaysMask from expected timings ---
  const isOffDayToday = useMemo(() => {
    if (!expectedTimings || typeof expectedTimings.OffDaysMask !== "number")
      return false;

    const mask = expectedTimings.OffDaysMask;
    const dow = new Date().getDay(); // 0 = Sunday ... 6 = Saturday

    // This is the bitwise check. (mask & (1 << dow)) will be non-zero if the bit for today is set.
    return (mask & (1 << dow)) !== 0;
  }, [expectedTimings]);

  const isCheckInBlocked = useMemo(() => {
    return (
      isProcessing ||
      loading ||
      isButtonDisabled || // Location check
      !!record?.CheckInAt || // Already checked in
      isBeforeExpectedCheckIn || // Too early
      isAfterExpectedCheckOut || // Too late
      isOffDayToday // <-- ADDED: Weekly off day
    );
  }, [
    isProcessing,
    loading,
    isButtonDisabled,
    record?.CheckInAt,
    isBeforeExpectedCheckIn,
    isAfterExpectedCheckOut,
    isOffDayToday, // <-- ADDED
  ]);

  const isCheckOutBlocked = useMemo(() => {
    return (
      isProcessing ||
      loading ||
      !record?.CheckInAt || // Not checked in yet
      !!record?.CheckOutAt || // Already checked out
      isBeforeExpectedCheckOut || // Too early
      isOffDayToday // <-- ADDED: Weekly off day
    );
  }, [
    isProcessing,
    loading,
    record?.CheckInAt,
    record?.CheckOutAt,
    isBeforeExpectedCheckOut,
    isOffDayToday, // <-- ADDED
  ]);
  ///========================================================

  const handleCheckIn = useCallback(() => {
    // Check-in is blocked if location is bad, already checked in, TOO EARLY, OR TOO LATE
    // This logic is now handled by the isCheckInBlocked useMemo
    if (isCheckInBlocked) {
      let statusMessage = "Check-in blocked.";
      if (!userLocation || isButtonDisabled) {
        statusMessage = "Out of office range or GPS not ready.";
      } else if (isBeforeExpectedCheckIn) {
        const expectedTimeDisplay = formatTime(
          expectedTimings?.ExpectedCheckIn || "09:00:00"
        );
        statusMessage = `Check-In blocked. Must wait until ${expectedTimeDisplay} (Expected Time).`;
      } else if (isAfterExpectedCheckOut) {
        const expectedTimeDisplay = formatTime(
          expectedTimings?.ExpectedCheckOut || "18:00:00"
        );
        statusMessage = `Check-In blocked. The allowed check-in window ended at ${expectedTimeDisplay}.`;
      } else if (isOffDayToday) {
        statusMessage = "Check-In blocked. Today is your weekly off day.";
      }
      setLocationStatus(statusMessage);
      return;
    }
    setIsProcessing(true);
    setLocationStatus("Opening camera for selfie...");
    setShowCameraModal(true);
  }, [
    isCheckInBlocked, // <-- Simplified dependency
    isProcessing,
    loading,
    isButtonDisabled,
    record,
    userLocation,
    isBeforeExpectedCheckIn,
    isAfterExpectedCheckOut,
    expectedTimings,
    isOffDayToday,
  ]);

  const handleSelfieCapture = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) {
        setLocationStatus("Selfie capture cancelled.");
        setIsProcessing(false);
        if (e.target) (e.target as HTMLInputElement).value = "";
        return;
      }
      if (!userLocation) {
        setLocationStatus("Location data lost. Please try again.");
        setIsProcessing(false);
        if (e.target) (e.target as HTMLInputElement).value = "";
        return;
      }
      setIsProcessing(true);
      setLocationStatus("Uploading selfie and initiating check-in...");
      try {
        const uploadRes = await uploadFile(file);
        if (!uploadRes.ok || !uploadRes.data.fileUrl) {
          setLocationStatus(
            `❌ Selfie Upload Failed: ${
              uploadRes.data.message || "Server error."
            }`
          );
          return;
        }
        const { fileUrl } = uploadRes.data;
        const checkInRes = await postData(`${API_BASE_URL}/check-in`, {
          userLat: userLocation.latitude,
          userLong: userLocation.longitude,
          selfieUrl: fileUrl,
        });
        if (checkInRes.ok) {
          setLocationStatus(`✅ Check-In Success!`);
          await fetchAttendanceRecord();
          await fetchAttendanceHistory();
        } else {
          setLocationStatus(
            `❌ Check-In Failed: ${checkInRes.data.message || "Server error."}`
          );
        }
      } catch (error) {
        setLocationStatus("Network error during check-in.");
      } finally {
        setIsProcessing(false);
        if (e.target) (e.target as HTMLInputElement).value = "";
      }
    },
    [userLocation, fetchAttendanceRecord, fetchAttendanceHistory]
  );

  const handleSelfieCaptureFromCamera = async (file: File) => {
    if (!userLocation) {
      setLocationStatus("Location data lost. Please try again.");
      return;
    }
    setIsProcessing(true);
    setLocationStatus("Uploading selfie and initiating check-in...");
    try {
      const uploadRes = await uploadFile(file);
      if (!uploadRes.ok || !uploadRes.data.fileUrl) {
        setLocationStatus(
          `❌ Upload Failed: ${uploadRes.data.message || "Server error."}`
        );
        return;
      }
      const { fileUrl } = uploadRes.data;
      const checkInRes = await postData(`${API_BASE_URL}/check-in`, {
        userLat: userLocation.latitude,
        userLong: userLocation.longitude,
        selfieUrl: fileUrl,
      });
      if (checkInRes.ok) {
        setLocationStatus(`✅ Check-In Success!`);
        await fetchAttendanceRecord();
        await fetchAttendanceHistory();
      } else {
        setLocationStatus(
          `❌ Check-In Failed: ${checkInRes.data.message || "Server error."}`
        );
      }
    } catch (error) {
      setLocationStatus("Network error during check-in.");
    } finally {
      setIsProcessing(false);
    }
    // setShowCameraModal(false);
  };

  const handleCheckOut = useCallback(async () => {
    // This logic is now handled by the isCheckOutBlocked useMemo
    if (isCheckOutBlocked) {
      let statusMessage = "Check-out blocked.";
      if (isBeforeExpectedCheckOut) {
        const expectedTimeDisplay = formatTime(
          expectedTimings?.ExpectedCheckOut || "18:00:00" // Default fallback time
        );
        statusMessage = `❌ Check-Out blocked. You must wait until ${expectedTimeDisplay} (Expected Check-Out Time) to log out.`;
      } else if (!record?.CheckInAt) {
        statusMessage = "❌ Check-Out blocked. You must check in first.";
      } else if (!!record?.CheckOutAt) {
        statusMessage = "❌ Check-Out blocked. Already checked out for today.";
      } else if (isOffDayToday) {
        statusMessage = "Check-Out blocked. Today is your weekly off day.";
      }
      setLocationStatus(statusMessage);
      return;
    }

    console.log("handleCheckOut called. Current record:", record); // Log 1: Initial state

    setIsProcessing(true);
    setLocationStatus("Sending check-out request...");
    try {
      const result = await postData(`${API_BASE_URL}/check-out`, {});
      if (result.ok) {
        setLocationStatus(`✅ Check-Out Success!`);
        console.log("Check-out API Success."); // Log 2: API result

        // --- OPTIMISTIC UPDATE ---
        const optimisticCheckOutTime = new Date().toISOString(); // Store the current time
        setRecord((prevRecord) => {
          console.log(
            "Optimistic setRecord START. Prev CheckOutAt:",
            prevRecord?.CheckOutAt
          ); // Log 3
          if (!prevRecord) return null; // Should ideally not happen if button was enabled
          const updatedRecord = {
            ...prevRecord,
            CheckOutAt: optimisticCheckOutTime, // Use the stored optimistic time
          };
          console.log(
            "Optimistic setRecord END. New CheckOutAt:",
            updatedRecord.CheckOutAt
          ); // Log 4
          return updatedRecord;
        });
        // --- END OPTIMISTIC UPDATE ---

        // Fetch fresh data from the server afterwards to get the exact time
        console.log("Calling fetchAttendanceRecord..."); // Log 5
        await fetchAttendanceRecord();
        console.log("fetchAttendanceRecord FINISHED."); // Log 6
        await fetchAttendanceHistory(); // Keep history fetch as well
      } else {
        setLocationStatus(
          `❌ Check-Out Failed: ${result.data.message || "Server error."}`
        );
        console.error("Check-out API Failed:", result.data); // Log API error
      }
    } catch (error) {
      setLocationStatus("Network error during check-out.");
      console.error("Network error in handleCheckOut:", error); // Log network error
    } finally {
      setIsProcessing(false);
    }
  }, [
    isCheckOutBlocked, // <-- Simplified dependency
    isProcessing,
    loading,
    record,
    isBeforeExpectedCheckOut,
    expectedTimings,
    setLocationStatus,
    setIsProcessing,
    setRecord,
    fetchAttendanceRecord,
    fetchAttendanceHistory,
    isOffDayToday,
  ]);

  useEffect(() => {
    console.log("Record state CHANGED:", record); // Log 7: See state after any update
  }, [record]);

  // --- FIXED: This useEffect now logs the correct variable ---
  useEffect(() => {
    console.log(
      "isCheckOutBlocked (from useMemo) state calculated:",
      isCheckOutBlocked, // <-- USE THE REAL VARIABLE
      "|| CheckOutAt:",
      record?.CheckOutAt
    );
  }, [isCheckOutBlocked, record?.CheckOutAt]); // <-- DEPEND ON THE REAL VARIABLE

  const handleBreakIn = useCallback(async () => {
    setIsProcessing(true);
    setLocationStatus("Sending break-in request...");
    try {
      const result = await postData(`${API_BASE_URL}/break-in`, {});
      if (result.ok) {
        setLocationStatus(`✅ Break-In Success!`);
        await fetchAttendanceRecord();
        await fetchAttendanceHistory();
      } else {
        setLocationStatus(
          `❌ Break-In Failed: ${result.data.message || "Server error."}`
        );
      }
    } catch (error) {
      setLocationStatus("Network error during break-in.");
    } finally {
      setIsProcessing(false);
    }
  }, [fetchAttendanceRecord, fetchAttendanceHistory]);

  const handleBreakOut = useCallback(async () => {
    setIsProcessing(true);
    setLocationStatus("Sending break-out request...");
    try {
      const result = await postData(`${API_BASE_URL}/break-out`, {});
      if (result.ok) {
        setLocationStatus(`✅ Break-Out Success!`);
        await fetchAttendanceRecord();
        await fetchAttendanceHistory();
      } else {
        setLocationStatus(
          `❌ Break-In Failed: ${result.data.message || "Server error."}`
        );
      }
    } catch (error) {
      setLocationStatus("Network error during break-out.");
    } finally {
      setIsProcessing(false);
    }
  }, [fetchAttendanceRecord, fetchAttendanceHistory]);

  const refreshAll = useCallback(() => {
    fetchAttendanceRecord();
    fetchAttendanceHistory();
    fetchQueries();
    fetchExpectedTimings();
  }, [
    fetchAttendanceRecord,
    fetchAttendanceHistory,
    fetchQueries,
    fetchExpectedTimings,
  ]);

  const handleSubmitQuery = useCallback(async () => {
    if (!querySubject.trim() || !queryMessage.trim()) {
      setQueryStatus("❌ Subject and message are required.");
      return;
    }
    setIsSubmittingQuery(true);
    setQueryStatus("Submitting your query...");
    try {
      let proofUrl = null;
      if (queryProofFile) {
        const formData = new FormData();
        formData.append("selfie", queryProofFile);
        const token = window.localStorage?.getItem("token");
        const uploadRes = await fetch(`${API_BASE_URL}/upload-selfie`, {
          method: "POST",
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadRes.ok && uploadData.fileUrl) {
          proofUrl = uploadData.fileUrl;
        } else {
          setQueryStatus("❌ Failed to upload proof file.");
          setIsSubmittingQuery(false);
          return;
        }
      }
      const queryData = {
        subject: querySubject,
        message: queryMessage,
        proofurl: proofUrl,
      };
      const result = await postData(`${API_BASE_URL}/query`, queryData);
      if (result.ok) {
        setQueryStatus("✅ Query submitted successfully!");
        setQuerySubject("");
        setQueryMessage("");
        setQueryProofFile(null);
        if (proofInputRef.current) proofInputRef.current.value = "";
        await fetchQueries();
        setTimeout(() => setShowQueryForm(false), 1500);
      } else {
        setQueryStatus(
          `❌ Query submission failed: ${
            result.data.message || "Server error."
          }`
        );
      }
    } catch (error) {
      setQueryStatus("❌ Network error during query submission.");
    } finally {
      setIsSubmittingQuery(false);
    }
  }, [querySubject, queryMessage, queryProofFile, fetchQueries]);

  const handleProofFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setQueryProofFile(file);
      }
    },
    []
  );

  const formatToISOLocal = (date: Date): string => {
    const pad = (num: number) => num.toString().padStart(2, "0");
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleEditCheckIn = useCallback(async () => {
    if (!record || !record.CheckInAt || !record.AttendanceId) {
      setLocationStatus("❌ No Check-In record to edit.");
      return;
    }

    const currentCheckIn = new Date(record.CheckInAt);
    const defaultValue = formatToISOLocal(currentCheckIn);

    const newTimeStr = window.prompt("Enter new Check-In time:", defaultValue);

    if (!newTimeStr) return; // User cancelled

    const newTime = new Date(newTimeStr);
    if (isNaN(newTime.getTime())) {
      setLocationStatus("❌ Invalid date format.");
      return;
    }

    setIsProcessing(true);
    setLocationStatus("Updating Check-In time...");
    const res = await patchData(
      `${API_BASE_URL}/record/${record.AttendanceId}/check-in`,
      { newCheckInTime: newTime.toISOString() }
    );

    if (res.ok) {
      setLocationStatus("✅ Check-In time updated!");
      await fetchAttendanceRecord(); // Refresh data
    } else {
      setLocationStatus(
        `❌ Update failed: ${res.data.message || "Server error."}`
      );
    }
    setIsProcessing(false);
  }, [record, fetchAttendanceRecord]);

  const handleEditCheckOut = useCallback(async () => {
    if (!record || !record.CheckOutAt || !record.AttendanceId) {
      setLocationStatus("❌ No Check-Out record to edit.");
      return;
    }

    const currentCheckOut = new Date(record.CheckOutAt);
    const defaultValue = formatToISOLocal(currentCheckOut);

    const newTimeStr = window.prompt("Enter new Check-Out time:", defaultValue);

    if (!newTimeStr) return; // User cancelled

    const newTime = new Date(newTimeStr);
    if (isNaN(newTime.getTime())) {
      setLocationStatus("❌ Invalid date format.");
      return;
    }

    setIsProcessing(true);
    setLocationStatus("Updating Check-Out time...");
    const res = await patchData(
      `${API_BASE_URL}/record/${record.AttendanceId}/check-out`,
      { newCheckOutTime: newTime.toISOString() }
    );

    if (res.ok) {
      setLocationStatus("✅ Check-Out time updated!");
      await fetchAttendanceRecord(); // Refresh data
    } else {
      setLocationStatus(
        `❌ Update failed: ${res.data.message || "Server error."}`
      );
    }
    setIsProcessing(false);
  }, [record, fetchAttendanceRecord]);

  const currentDuration = useMemo(() => {
    if (!record || !record.CheckInAt) return "00:00";
    return calculateDuration(record.CheckInAt, record.CheckOutAt);
  }, [record]);

  const currentBreakDuration = useMemo(() => {
    if (!record || !record.BreakInAt) return "00:00";
    return calculateDuration(record.BreakInAt, record.BreakOutAt);
  }, [record]);

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      Pending:
        "bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border-yellow-300",
      Resolved:
        "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300",
      Rejected:
        "bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border-red-300",
    };
    return (
      statusColors[status] ||
      "bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-300"
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 border border-indigo-100 backdrop-blur-lg bg-opacity-90">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
              <Clock className="w-8 h-8 text-indigo-600 animate-pulse" />
              Attendance Portal
            </h1>
            <Button
              variant="secondary"
              onClick={refreshAll}
              className="px-4 py-2"
              disabled={isProcessing || loading}
            >
              <RefreshCw
                className={`w-5 h-5 ${
                  isProcessing || loading ? "animate-spin" : ""
                }`}
              />
            </Button>
          </div>
        </div>

        {/* Location Status Card (Updated with Expected Time Status) */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 backdrop-blur-lg bg-opacity-90 transform hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-xl ${
                isButtonDisabled ? "bg-red-100" : "bg-green-100"
              }`}
            >
              <MapPin
                className={`w-6 h-6 ${
                  isButtonDisabled ? "text-red-600" : "text-green-600"
                }`}
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-600 mb-1">
                Live Location Status
              </p>
              <p
                className={`text-lg font-bold ${
                  isButtonDisabled ? "text-red-600" : "text-green-600"
                }`}
              >
                {locationStatus}
              </p>
            </div>
          </div>
          {/* NEW: Expected Time Status Display */}
          {expectedTimings &&
            (isBeforeExpectedCheckIn || isAfterExpectedCheckOut) && (
              <div className="mt-4 p-3 bg-red-50 border border-red-300 rounded-lg">
                <p className="text-sm text-red-700 font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Attendance Blocked
                </p>
                {isBeforeExpectedCheckIn && (
                  <p className="text-xs text-red-600 mt-1">
                    Check-In Not Allowed Yet. Expected Check-In Time: **
                    {formatTime(expectedTimings.ExpectedCheckIn)}**.
                  </p>
                )}
                {isAfterExpectedCheckOut && (
                  <p className="text-xs text-red-600 mt-1">
                    Check-In/Check-Out window has closed. Expected Check-Out
                    Time: **{formatTime(expectedTimings.ExpectedCheckOut)}**.
                  </p>
                )}
              </div>
            )}
        </div>

        {/* Today's Record Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 backdrop-blur-lg bg-opacity-90">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-gray-800">
            <Calendar className="w-6 h-6 text-indigo-600" />
            Today's Record
          </h2>
          {loading ? (
            <div className="text-gray-500 flex items-center justify-center p-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-3" />
              <span className="text-lg">Loading...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border-2 border-green-200 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
                <p className="text-sm font-semibold text-gray-600 mb-2">
                  Check-in Time
                </p>
                <p className="text-3xl font-extrabold text-green-700">
                  {formatTime(record?.CheckInAt)}
                </p>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-5 border-2 border-red-200 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
                <p className="text-sm font-semibold text-gray-600 mb-2">
                  Check-out Time
                </p>

                <p className="text-3xl font-extrabold text-red-700">
                  {formatTime(record?.CheckOutAt)}
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border-2 border-blue-200 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
                <p className="text-sm font-semibold text-gray-600 mb-2">
                  Total Duration
                </p>
                <p className="text-3xl font-extrabold text-blue-700">
                  {currentDuration}
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border-2 border-green-200 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
                <p className="text-sm font-semibold text-gray-600 mb-2">
                  Break-In Time
                </p>
                <p className="text-3xl font-extrabold text-green-700">
                  {formatTime(record?.BreakInAt)}
                </p>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-5 border-2 border-red-200 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
                <p className="text-sm font-semibold text-gray-600 mb-2">
                  Break-out Time
                </p>
                <p className="text-3xl font-extrabold text-red-700">
                  {formatTime(record?.BreakOutAt)}
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border-2 border-blue-200 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
                <p className="text-sm font-semibold text-gray-600 mb-2">
                  Total Duration
                </p>
                <p className="text-3xl font-extrabold text-blue-700">
                  {currentBreakDuration}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* --- "On Leave" BANNER REMOVED --- */}

        {/* --- ADD THIS NEW BANNER --- */}
        {isOffDayToday && (
          <div className="mb-4 rounded-lg border border-gray-300 bg-gray-100 p-3 text-sm text-gray-800">
            Today is your scheduled weekly off day. All attendance actions are
            disabled.
          </div>
        )}
        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={handleCheckIn}
            disabled={isCheckInBlocked}
            variant="success"
            className="w-full py-4 text-lg"
          >
            {isProcessing && !record?.CheckInAt ? (
              <span className="flex items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin" />
                Checking In...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Check In
              </span>
            )}
          </Button>

          {/* --- FIXED: This button now uses the correct variable --- */}
          <Button
            variant="danger"
            onClick={handleCheckOut}
            disabled={isCheckOutBlocked} // <-- USE THE REAL VARIABLE
            className="w-full py-4 text-lg"
          >
            {isProcessing && record?.CheckInAt && !record?.CheckOutAt ? (
              <span className="flex items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin" />
                Checking Out...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <XCircle className="w-5 h-5" />
                Check Out
              </span>
            )}
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={handleBreakIn}
            disabled={record?.BreakInAt || isOffDayToday}
          >
            Break In
          </Button>
          <Button
            onClick={handleBreakOut}
            disabled={!record?.BreakInAt || record?.BreakOutAt || isOffDayToday}
          >
            Break Out
          </Button>
        </div>

        {showCameraModal && (
          <CameraModal
            onCapture={handleSelfieCaptureFromCamera}
            onClose={() => setShowCameraModal(false)}
          />
        )}

        {/* Attendance History */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 backdrop-blur-lg bg-opacity-90">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-600" />
            Attendance History
          </h2>
          {historyLoading ? (
            <div className="text-gray-500 flex items-center justify-center p-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-3" />
              <span>Loading History...</span>
            </div>
          ) : history.length === 0 ? (
            <p className="text-gray-500 p-6 bg-gray-50 rounded-xl text-center">
              No records found.
            </p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
              {history.map((hist, index) => (
                <div
                  key={hist.WorkDate || index}
                  className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]"
                >
                  <div className="flex flex-col mb-3 md:mb-0">
                    <span className="font-bold text-lg text-indigo-600">
                      {formatDate(hist.WorkDate)}
                    </span>
                    <span className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      <Clock className="w-4 h-4" />
                      {calculateDuration(hist.CheckInAt, hist.CheckOutAt)} Total
                    </span>
                  </div>
                  <div className="flex gap-6 text-sm">
                    <div className="flex flex-col items-center bg-green-50 px-4 py-2 rounded-lg border border-green-200">
                      <CheckCircle className="w-5 h-5 text-green-600 mb-1" />
                      <span className="text-xs text-gray-500">In</span>
                      <span className="font-bold text-green-700">
                        {formatTime(hist.CheckInAt)}
                      </span>
                    </div>
                    <div
                      className={`flex flex-col items-center px-4 py-2 rounded-lg border ${
                        hist.CheckOutAt
                          ? "bg-red-50 border-red-200"
                          : "bg-yellow-50 border-yellow-200"
                      }`}
                    >
                      <XCircle
                        className={`w-5 h-5 mb-1 ${
                          hist.CheckOutAt ? "text-red-600" : "text-yellow-600"
                        }`}
                      />
                      <span className="text-xs text-gray-500">Out</span>
                      <span
                        className={`font-bold ${
                          hist.CheckOutAt ? "text-red-700" : "text-yellow-700"
                        }`}
                      >
                        {formatTime(hist.CheckOutAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Query Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 backdrop-blur-lg bg-opacity-90">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <MessageSquare className="w-6 h-6 text-indigo-600" />
              Support Queries
            </h2>
            <Button
              onClick={() => setShowQueryForm(!showQueryForm)}
              className="px-4 py-2"
            >
              {showQueryForm ? "Hide Form" : "Raise Query"}
            </Button>
          </div>

          {showQueryForm && (
            <div className="mb-6 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-6 space-y-4 animate-in">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  value={querySubject}
                  onChange={(e) => setQuerySubject(e.target.value)}
                  placeholder="e.g., Forgot to Check Out"
                  className="w-full px-4 py-3 border-2 border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  disabled={isSubmittingQuery}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  value={queryMessage}
                  onChange={(e) => setQueryMessage(e.target.value)}
                  placeholder="Describe your query in detail..."
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all duration-300"
                  disabled={isSubmittingQuery}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Paperclip className="w-4 h-4" />
                  Attach Proof (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  ref={proofInputRef}
                  onChange={handleProofFileChange}
                  className="w-full text-sm text-gray-600 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 file:cursor-pointer transition-all duration-300"
                  disabled={isSubmittingQuery}
                />
                {queryProofFile && (
                  <p className="text-sm text-green-600 mt-2 flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg">
                    <CheckCircle className="w-4 h-4" />
                    {queryProofFile.name}
                  </p>
                )}
              </div>

              {queryStatus && (
                <div
                  className={`p-4 rounded-xl font-medium ${
                    queryStatus.includes("✅")
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {queryStatus}
                </div>
              )}

              <Button
                onClick={handleSubmitQuery}
                disabled={
                  isSubmittingQuery ||
                  !querySubject.trim() ||
                  !queryMessage.trim()
                }
                className="w-full py-3 text-lg"
              >
                {isSubmittingQuery ? (
                  <span className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  "Submit Query"
                )}
              </Button>
            </div>
          )}

          {/* Query History */}
          <div>
            <h3 className="text-lg font-bold text-gray-700 mb-4 border-b-2 border-gray-200 pb-2">
              Your Query History
            </h3>
            {queriesLoading ? (
              <div className="text-gray-500 flex items-center justify-center p-8">
                <RefreshCw className="w-6 h-6 animate-spin mr-3" />
                <span>Loading Queries...</span>
              </div>
            ) : queries.length === 0 ? (
              <p className="text-gray-500 p-6 bg-gray-50 rounded-xl text-center">
                No queries submitted yet.
              </p>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {queries.map((query) => (
                  <div
                    key={query.QueryId}
                    className="bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 rounded-xl p-5 shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-[1.01]"
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start gap-3 mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800 text-lg mb-1">
                          {query.Subject}
                        </h3>
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDateTime(query.RaisedAt)}
                        </p>
                      </div>
                      <span
                        className={`px-4 py-2 rounded-full text-xs font-bold border-2 ${getStatusBadge(
                          query.Status
                        )} shadow-sm`}
                      >
                        {query.Status}
                      </span>
                    </div>

                    <p className="text-sm text-gray-700 mb-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                      {query.Message}
                    </p>

                    {query.Proofurl && (
                      <div className="mb-3">
                        <a
                          href={query.Proofurl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-2 bg-indigo-50 px-3 py-2 rounded-lg w-fit transition-all duration-300 hover:bg-indigo-100"
                        >
                          <Paperclip className="w-4 h-4" />
                          View Attached Proof
                        </a>
                      </div>
                    )}

                    {query.ResolutionNotes && (
                      <div className="mt-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl">
                        <p className="text-xs font-bold text-green-800 mb-2 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          Resolution Notes:
                        </p>
                        <p className="text-sm text-green-700 font-medium">
                          {query.ResolutionNotes}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
// // // // ============================================================//

// "use client";
// import { useEffect, useState, useCallback, useMemo, useRef } from "react";

// import {
//   requestNotificationPermission,
//   sendNotification,
// } from "../../src/utils/notification.utils";

// import CameraModal from "@/components/CameraCapture";

// const OFFICE_RADIUS_METERS = 100;
// const API_BASE_URL = "http://localhost:5050/attendance";
// // Base URL for user-related config (where expected timings are)
// const USER_API_BASE_URL = "http://localhost:5050/users";

// interface Coordinates {
//   latitude: number;
//   longitude: number;
// }

// interface AttendanceRecord {
//   WorkDate: string;
//   CheckInAt: string | null;
//   CheckOutAt: string | null;
//   BreakInAt: string | null;
//   BreakOutAt: string | null;
//   TotalBreakDuration: string | null;
//   AttendanceId: number;
// }

// // Interface for Expected Timings
// // interface ExpectedTimings {
// //   UserId: string;
// //   ExpectedCheckIn: string; // HH:MM:SS
// //   ExpectedCheckOut: string; // HH:MM:SS
// //   ExpectedBreakIn: string | null; // HH:MM:SS or null
// //   ExpectedBreakOut: string | null; // HH:MM:SS or null
// // }

// // Interface for Expected Timings
// interface ExpectedTimings {
//   UserId: string;
//   ExpectedCheckIn: string; // HH:MM:SS
//   ExpectedCheckOut: string; // HH:MM:SS
//   ExpectedBreakIn: string | null; // HH:MM:SS or null
//   ExpectedBreakOut: string | null; // HH:MM:SS or null
//   OffDaysMask: number; // <-- ADD THIS LINE
// }

// interface Query {
//   QueryId: string;
//   UserId: string;
//   Subject: string;
//   Message: string;
//   Proofurl: string | null;
//   Status: string;
//   RaisedAt: string;
//   ResolutionNotes: string | null;
// }

// // Enhanced Button Component
// const Button = ({
//   children,
//   onClick,
//   disabled = false,
//   variant = "primary",
//   className = "",
// }: any) => {
//   let baseStyle =
//     "px-6 py-3 font-semibold rounded-xl transition-all duration-300 shadow-lg transform hover:scale-105 active:scale-95 disabled:transform-none disabled:hover:scale-100";

//   if (variant === "secondary") {
//     baseStyle +=
//       " bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 hover:from-gray-200 hover:to-gray-300 hover:shadow-xl";
//   } else if (variant === "success") {
//     baseStyle +=
//       " bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 hover:shadow-green-500/50";
//   } else if (variant === "danger") {
//     baseStyle +=
//       " bg-gradient-to-r from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700 hover:shadow-red-500/50";
//   } else {
//     baseStyle +=
//       " bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 hover:shadow-indigo-500/50";
//   }

//   if (disabled) {
//     baseStyle =
//       "px-6 py-3 font-semibold rounded-xl bg-gray-300 text-gray-500 cursor-not-allowed opacity-60";
//   }

//   return (
//     <button
//       onClick={onClick}
//       disabled={disabled}
//       className={`${baseStyle} ${className}`}
//     >
//       {children}
//     </button>
//   );
// };

// // Mock Icons with enhanced styling
// const Clock = (props: any) => (
//   <svg
//     {...props}
//     fill="none"
//     viewBox="0 0 24 24"
//     stroke="currentColor"
//     strokeWidth="2"
//   >
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
//     />
//   </svg>
// );

// const PencilIcon = (props: any) => (
//   <svg
//     {...props}
//     fill="none"
//     viewBox="0 0 24 24"
//     stroke="currentColor"
//     strokeWidth="2"
//   >
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
//     />
//   </svg>
// );

// const Calendar = (props: any) => (
//   <svg
//     {...props}
//     fill="none"
//     viewBox="0 0 24 24"
//     stroke="currentColor"
//     strokeWidth="2"
//   >
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
//     />
//   </svg>
// );

// const CheckCircle = (props: any) => (
//   <svg
//     {...props}
//     fill="none"
//     viewBox="0 0 24 24"
//     stroke="currentColor"
//     strokeWidth="2"
//   >
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
//     />
//   </svg>
// );

// const XCircle = (props: any) => (
//   <svg
//     {...props}
//     fill="none"
//     viewBox="0 0 24 24"
//     stroke="currentColor"
//     strokeWidth="2"
//   >
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
//     />
//   </svg>
// );

// const RefreshCw = (props: any) => (
//   <svg
//     {...props}
//     fill="none"
//     viewBox="0 0 24 24"
//     stroke="currentColor"
//     strokeWidth="2"
//   >
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       d="M4 4v5h.582m15.356-2A8.995 8.995 0 0120.9 9H20a9 9 0 00-18 0h1.01a7.973 7.973 0 0115.356-2.981L16 9m-4 5l3-3m-3 3l-3-3m3 3V7"
//     />
//   </svg>
// );

// const MessageSquare = (props: any) => (
//   <svg
//     {...props}
//     fill="none"
//     viewBox="0 0 24 24"
//     stroke="currentColor"
//     strokeWidth="2"
//   >
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
//     />
//   </svg>
// );

// const Paperclip = (props: any) => (
//   <svg
//     {...props}
//     fill="none"
//     viewBox="0 0 24 24"
//     stroke="currentColor"
//     strokeWidth="2"
//   >
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
//     />
//   </svg>
// );

// const MapPin = (props: any) => (
//   <svg
//     {...props}
//     fill="none"
//     viewBox="0 0 24 24"
//     stroke="currentColor"
//     strokeWidth="2"
//   >
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
//     />
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
//     />
//   </svg>
// );

// // Haversine Formula
// const getDistanceInMeters = (start: Coordinates, end: Coordinates): number => {
//   const R = 6371000;
//   const toRad = (angle: number) => (Math.PI / 180) * angle;
//   const dLat = toRad(end.latitude - start.latitude);
//   const dLon = toRad(end.longitude - start.longitude);
//   const a =
//     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//     Math.cos(toRad(start.latitude)) *
//       Math.cos(toRad(end.latitude)) *
//       Math.sin(dLon / 2) *
//       Math.sin(dLon / 2);
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// };

// // API Helpers
// const postData = async (url: string, data: any) => {
//   const token = window.localStorage?.getItem("token");
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

// const patchData = async (url: string, data: any) => {
//   const token = window.localStorage?.getItem("token");
//   const response = await fetch(url, {
//     method: "PATCH", // <--- Use PATCH method
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
//   const token = window.localStorage?.getItem("token");
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

// // Formatting Helpers
// const formatTime = (isoString: string | null): string => {
//   if (!isoString) return "—";
//   // Check if it's a pure HH:MM:SS string (like from ExpectedTimings)
//   if (isoString.match(/^\d{2}:\d{2}:\d{2}$/)) {
//     try {
//       // Construct a Date object for today to use toLocaleTimeString
//       const [h, m, s] = isoString.split(":").map(Number);
//       const date = new Date();
//       date.setHours(h, m, s, 0);
//       return date.toLocaleTimeString("en-IN", {
//         hour: "2-digit",
//         minute: "2-digit",
//         hour12: true,
//       });
//     } catch {
//       return isoString.substring(0, 5); // Fallback to HH:MM if parsing fails
//     }
//   }

//   // Standard ISO date string conversion
//   try {
//     const date = new Date(isoString);
//     return date.toLocaleTimeString("en-IN", {
//       hour: "2-digit",
//       minute: "2-digit",
//       hour12: true,
//     });
//   } catch {
//     return "—";
//   }
// };

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

// const formatDateTime = (isoString: string): string => {
//   try {
//     const date = new Date(isoString);
//     return date.toLocaleDateString("en-IN", {
//       month: "short",
//       day: "numeric",
//       year: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//     });
//   } catch {
//     return "Invalid Date";
//   }
// };

// const calculateDuration = (
//   checkIn: string | null,
//   checkOut: string | null
// ): string => {
//   if (!checkIn) return "00:00";
//   try {
//     const inTime = new Date(checkIn).getTime();
//     const outTime = checkOut ? new Date(checkOut).getTime() : Date.now();
//     if (outTime < inTime) return "Error";
//     const diffMs = outTime - inTime;
//     const hours = Math.floor(diffMs / (1000 * 60 * 60));
//     const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
//     const pad = (num: number) => num.toString().padStart(2, "0");
//     return `${pad(hours)}:${pad(minutes)}`;
//   } catch {
//     return "Error";
//   }
// };

// export default function AttendancePage() {
//   const [record, setRecord] = useState<AttendanceRecord | null>(null);
//   const [history, setHistory] = useState<AttendanceRecord[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [historyLoading, setHistoryLoading] = useState<boolean>(false);
//   const [officeLocation, setOfficeLocation] = useState<Coordinates | null>(
//     null
//   );
//   const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
//   const [locationStatus, setLocationStatus] = useState<string>(
//     "Initializing location checks..."
//   );
//   const [isButtonDisabled, setIsButtonDisabled] = useState<boolean>(true);
//   const [isProcessing, setIsProcessing] = useState<boolean>(false);
//   const [currentUserId, setCurrentUserId] = useState<string | null>(null);
//   const [queries, setQueries] = useState<Query[]>([]);
//   const [queriesLoading, setQueriesLoading] = useState<boolean>(false);
//   const [querySubject, setQuerySubject] = useState<string>("");
//   const [queryMessage, setQueryMessage] = useState<string>("");
//   const [queryProofFile, setQueryProofFile] = useState<File | null>(null);
//   const [isSubmittingQuery, setIsSubmittingQuery] = useState<boolean>(false);
//   const [queryStatus, setQueryStatus] = useState<string>("");
//   const [showQueryForm, setShowQueryForm] = useState<boolean>(false);

//   const [showCameraModal, setShowCameraModal] = useState(false);

//   // --- NEW: State for Availability ---
//   const [availability, setAvailability] = useState<{
//     isAvailable: boolean;
//     availabilityStatus: "Available" | "OnLeave" | "Sick" | "Unavailable";
//     leaveStartDate: string | null;
//     leaveEndDate: string | null;
//   } | null>(null);
//   const [isSavingAvailability, setIsSavingAvailability] = useState(false);
//   // --- END NEW STATE ---

//   // NEW STATE: Expected Timings
//   const [expectedTimings, setExpectedTimings] =
//     useState<ExpectedTimings | null>(null);
//   const [isBeforeExpectedCheckIn, setIsBeforeExpectedCheckIn] =
//     useState<boolean>(false);
//   const [isAfterExpectedCheckOut, setIsAfterExpectedCheckOut] =
//     useState<boolean>(false); //
//   const [isBeforeExpectedCheckOut, setIsBeforeExpectedCheckOut] =
//     useState<boolean>(false);

//   const fileInputRef = useRef<HTMLInputElement>(null);
//   const proofInputRef = useRef<HTMLInputElement>(null);

//   const uploadFile = async (file: File) => {
//     const token = window.localStorage?.getItem("token");
//     const formData = new FormData();
//     formData.append("selfie", file);
//     const response = await fetch(`${API_BASE_URL}/upload-selfie`, {
//       method: "POST",
//       headers: {
//         ...(token && { Authorization: `Bearer ${token}` }),
//       },
//       body: formData,
//     });
//     return {
//       data: await response
//         .json()
//         .catch(() => ({ message: response.statusText })),
//       ok: response.ok,
//       status: response.status,
//     };
//   };

//   const getCurrentUserId = (): string | null => {
//     if (typeof window !== "undefined" && window.localStorage) {
//       const userJson = window.localStorage.getItem("user");
//       if (userJson) {
//         try {
//           const userObject = JSON.parse(userJson);
//           if (userObject && userObject.userId) {
//             return userObject.userId;
//           }
//         } catch (e) {
//           console.error("Failed to parse user JSON from localStorage.", e);
//           return null;
//         }
//       }
//       console.warn(
//         "localStorage key 'user' is unavailable or improperly formatted."
//       );
//       return null;
//     }
//     return null;
//   };

//   // --- MODIFIED: This function now fetches both timings and availability ---
//   const fetchExpectedTimings = useCallback(async () => {
//     const currentUserId = getCurrentUserId();

//     if (!currentUserId) {
//       setExpectedTimings(null);
//       setAvailability(null); // <-- Also set availability to null
//       console.error(
//         "Cannot fetch configuration: User ID is unavailable on the client."
//       );
//       return;
//     }

//     try {
//       // Use the /configuration endpoint from the plan
//       const res = await fetchData(
//         `${USER_API_BASE_URL}/${currentUserId}/configuration`
//       );

//       if (res.ok && res.data) {
//         // Set Expected Timings
//         setExpectedTimings(
//           res.data.expectedTimings?.ExpectedCheckIn
//             ? res.data.expectedTimings
//             : null
//         );

//         // Set Availability
//         setAvailability({
//           isAvailable: !!res.data.availability?.IsAvailable,
//           availabilityStatus:
//             res.data.availability?.AvailabilityStatus || "Available",
//           leaveStartDate: res.data.availability?.LeaveStartDate || null,
//           leaveEndDate: res.data.availability?.LeaveEndDate || null,
//         });
//       } else {
//         console.error(
//           `Fetch failed with status ${res.status}. Check user rank or if config exists.`
//         );
//         setExpectedTimings(null);
//         setAvailability(null); // <-- Also set availability to null
//       }
//     } catch (error) {
//       console.error("Failed to fetch configuration:", error);
//       setExpectedTimings(null);
//       setAvailability(null); // <-- Also set availability to null
//     }
//   }, []); // No dependencies needed here as getCurrentUserId is stable

//   const fetchAttendanceRecord = useCallback(async () => {
//     setLoading(true);
//     try {
//       const res = await fetchData(`${API_BASE_URL}/my`);
//       if (res.ok) {
//         setRecord(res.data.record || null);
//       } else {
//         setRecord(null);
//       }
//     } catch (error) {
//       setRecord(null);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   const fetchAttendanceHistory = useCallback(async () => {
//     setHistoryLoading(true);
//     try {
//       const res = await fetchData(`${API_BASE_URL}/history`);
//       if (res.ok) {
//         const recordData = res.data.record;
//         const records = Array.isArray(recordData) ? recordData : [recordData];
//         records.sort(
//           (a, b) =>
//             new Date(b.WorkDate).getTime() - new Date(a.WorkDate).getTime()
//         );
//         setHistory(records);
//       } else {
//         setHistory([]);
//       }
//     } catch (error) {
//       setHistory([]);
//     } finally {
//       setHistoryLoading(false);
//     }
//   }, []);

//   const fetchQueries = useCallback(async () => {
//     setQueriesLoading(true);
//     try {
//       const res = await fetchData(`${API_BASE_URL}/query/history`);
//       if (res.ok) {
//         const historyData = res.data.history;
//         const queryList = Array.isArray(historyData)
//           ? historyData
//           : [historyData];
//         setQueries(queryList);
//       } else {
//         setQueries([]);
//       }
//     } catch (error) {
//       setQueries([]);
//     } finally {
//       setQueriesLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     requestNotificationPermission();
//     fetchAttendanceRecord();
//     fetchAttendanceHistory();
//     fetchQueries();

//     // This now fetches both timings AND availability
//     fetchExpectedTimings();

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
//           setLocationStatus(`Error: Could not fetch office location.`);
//         }
//       } catch (e) {
//         setLocationStatus("Network error fetching office location.");
//       }
//     };
//     fetchOfficeLocation();
//   }, [
//     fetchAttendanceRecord,
//     fetchAttendanceHistory,
//     fetchQueries,
//     fetchExpectedTimings,
//   ]);

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
//         const distance = getDistanceInMeters(currentLoc, officeLocation);
//         const isTooFar = distance > OFFICE_RADIUS_METERS;
//         setLocationStatus(
//           isTooFar
//             ? `Outside office range: ${distance.toFixed(0)}m away`
//             : `Within range: ${distance.toFixed(0)}m from office`
//         );
//         setIsButtonDisabled(isTooFar);
//       },
//       (err) => {
//         setLocationStatus(`Location Error: ${err.message}`);
//         setIsButtonDisabled(true);
//       },
//       { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
//     );
//     return () => navigator.geolocation.clearWatch(watchId);
//   }, [officeLocation]);

//   // useEffect(() => {
//   //   // Timer ID for the single, scheduled notification
//   //   let notificationTimer: ReturnType<typeof setTimeout> | null = null;
//   //   // Timer ID for the recurring validation check (every 10 seconds)
//   //   let validationTimer: ReturnType<typeof setTimeout> | null = null;

//   //   const checkTime = () => {
//   //     // --- ADD CONSOLE LOGS ---
//   //     console.log("--- checkTime ---");
//   //     console.log("Current Time:", new Date().toLocaleTimeString());
//   //     console.log("Expected Timings:", expectedTimings);
//   //     console.log("Current Record:", record);
//   //     // --- END CONSOLE LOGS ---
//   //     if (
//   //       !expectedTimings?.ExpectedCheckIn ||
//   //       !expectedTimings?.ExpectedCheckOut
//   //     ) {
//   //       setIsBeforeExpectedCheckIn(false);
//   //       setIsAfterExpectedCheckOut(false);
//   //       setIsBeforeExpectedCheckOut(false);
//   //       return;
//   //     }

//   //     const expectedInTimeStr = expectedTimings.ExpectedCheckIn;
//   //     const expectedOutTimeStr = expectedTimings.ExpectedCheckOut;
//   //     const now = new Date();

//   //     // --- 1. Calculate Expected Check In Date ---
//   //     const [inHours, inMinutes, inSeconds] = expectedInTimeStr
//   //       .split(":")
//   //       .map(Number);
//   //     const expectedCheckInDate = new Date();
//   //     expectedCheckInDate.setHours(inHours, inMinutes, inSeconds, 0);

//   //     // --- 2. Calculate Expected Check Out Date ---
//   //     const [outHours, outMinutes, outSeconds] = expectedOutTimeStr
//   //       .split(":")
//   //       .map(Number);
//   //     const expectedCheckOutDate = new Date();
//   //     expectedCheckOutDate.setHours(outHours, outMinutes, outSeconds, 0);

//   //     // --- 3. Notification Scheduling Logic ---
//   //     const timeUntilCheckInMs = expectedCheckInDate.getTime() - now.getTime();

//   //     // Clear previous scheduled notification
//   //     if (notificationTimer) {
//   //       clearTimeout(notificationTimer);
//   //       notificationTimer = null;
//   //     }

//   //     // Schedule notification only if:
//   //     // a) The expected time is in the future (> 5s buffer)
//   //     // b) The user has NOT checked in yet
//   //     if (timeUntilCheckInMs > 5000 && !record?.CheckInAt) {
//   //       notificationTimer = setTimeout(() => {
//   //         sendNotification(
//   //           // <-- Calls the external utility
//   //           "⏰ Time to Check In!",
//   //           `Your shift starts now (${formatTime(
//   //             expectedTimings.ExpectedCheckIn
//   //           )}).`
//   //         );
//   //         // Trigger a manual time check immediately after notification fires
//   //         checkTime();
//   //       }, timeUntilCheckInMs);
//   //     }

//   //     // --- 4. Validation Flags ---
//   //     setIsBeforeExpectedCheckIn(now < expectedCheckInDate);
//   //     setIsAfterExpectedCheckOut(now > expectedCheckOutDate);
//   //     setIsBeforeExpectedCheckOut(now < expectedCheckOutDate);

//   //     // Set the next validation check for the UI flags
//   //     validationTimer = setTimeout(checkTime, 10000);
//   //   };

//   //   // Initial run
//   //   const initialTimer = setTimeout(checkTime, 100);

//   //   // Cleanup function: Clear all timers when dependencies change or component unmounts
//   //   return () => {
//   //     clearTimeout(initialTimer);
//   //     if (validationTimer) clearTimeout(validationTimer);
//   //     if (notificationTimer) clearTimeout(notificationTimer);
//   //   };
//   // }, [expectedTimings, record?.CheckInAt]); // record?.CheckInAt is vital to cancel notification if user checks in early.

//   // Replace the time comparison logic in the useEffect around line 2460-2545
//   useEffect(() => {
//     let notificationTimer: ReturnType<typeof setTimeout> | null = null;
//     let validationTimer: ReturnType<typeof setTimeout> | null = null;

//     const checkTime = () => {
//       console.log("--- checkTime ---");
//       console.log("Current Time:", new Date().toLocaleTimeString());
//       console.log("Expected Timings:", expectedTimings);
//       console.log("Current Record:", record);

//       if (
//         !expectedTimings?.ExpectedCheckIn ||
//         !expectedTimings?.ExpectedCheckOut
//       ) {
//         setIsBeforeExpectedCheckIn(false);
//         setIsAfterExpectedCheckOut(false);
//         setIsBeforeExpectedCheckOut(false);
//         return;
//       }

//       const expectedInTimeStr = expectedTimings.ExpectedCheckIn;
//       const expectedOutTimeStr = expectedTimings.ExpectedCheckOut;
//       const now = new Date();

//       // FIXED: Create proper date objects for today with expected times
//       const [inHours, inMinutes, inSeconds] = expectedInTimeStr
//         .split(":")
//         .map(Number);
//       const expectedCheckInDate = new Date();
//       expectedCheckInDate.setHours(inHours, inMinutes, inSeconds, 0);

//       const [outHours, outMinutes, outSeconds] = expectedOutTimeStr
//         .split(":")
//         .map(Number);
//       const expectedCheckOutDate = new Date();
//       expectedCheckOutDate.setHours(outHours, outMinutes, outSeconds, 0);

//       // DEBUG: Add console logs to see what's happening
//       console.log(
//         "Expected Check-In Time:",
//         expectedCheckInDate.toLocaleTimeString()
//       );
//       console.log(
//         "Expected Check-Out Time:",
//         expectedCheckOutDate.toLocaleTimeString()
//       );
//       console.log("Current Time:", now.toLocaleTimeString());
//       console.log("Is now < expectedCheckInDate?", now < expectedCheckInDate);
//       console.log("Is now > expectedCheckOutDate?", now > expectedCheckOutDate);

//       // Notification Scheduling Logic
//       const timeUntilCheckInMs = expectedCheckInDate.getTime() - now.getTime();

//       if (notificationTimer) {
//         clearTimeout(notificationTimer);
//         notificationTimer = null;
//       }

//       if (timeUntilCheckInMs > 5000 && !record?.CheckInAt) {
//         notificationTimer = setTimeout(() => {
//           sendNotification(
//             "⏰ Time to Check In!",
//             `Your shift starts now (${formatTime(
//               expectedTimings.ExpectedCheckIn
//             )}).`
//           );
//           checkTime();
//         }, timeUntilCheckInMs);
//       }

//       // FIXED: Validation Flags with proper time comparison
//       setIsBeforeExpectedCheckIn(now < expectedCheckInDate);
//       setIsAfterExpectedCheckOut(now > expectedCheckOutDate);
//       setIsBeforeExpectedCheckOut(now < expectedCheckOutDate);

//       // Set the next validation check for the UI flags
//       validationTimer = setTimeout(checkTime, 10000);
//     };

//     // Initial run
//     const initialTimer = setTimeout(checkTime, 100);

//     return () => {
//       clearTimeout(initialTimer);
//       if (validationTimer) clearTimeout(validationTimer);
//       if (notificationTimer) clearTimeout(notificationTimer);
//     };
//   }, [expectedTimings, record?.CheckInAt]);

//   const handleCheckIn = useCallback(() => {
//     // Check-in is blocked if location is bad, already checked in, TOO EARLY, OR TOO LATE
//     // const isCheckInBlocked =
//     //   isProcessing ||
//     //   loading ||
//     //   isButtonDisabled ||
//     //   !!record?.CheckInAt ||
//     //   isBeforeExpectedCheckIn ||
//     //   isAfterExpectedCheckOut;

//     if (isCheckInBlocked) {
//       let statusMessage = "Check-in blocked.";
//       if (!userLocation || isButtonDisabled) {
//         statusMessage = "Out of office range or GPS not ready.";
//       } else if (isBeforeExpectedCheckIn) {
//         const expectedTimeDisplay = formatTime(
//           expectedTimings?.ExpectedCheckIn || "09:00:00"
//         );
//         statusMessage = `Check-In blocked. Must wait until ${expectedTimeDisplay} (Expected Time).`;
//       } else if (isAfterExpectedCheckOut) {
//         const expectedTimeDisplay = formatTime(
//           expectedTimings?.ExpectedCheckOut || "18:00:00"
//         );
//         statusMessage = `Check-In blocked. The allowed check-in window ended at ${expectedTimeDisplay}.`;
//       }
//       setLocationStatus(statusMessage);
//       return;
//     }
//     setIsProcessing(true);
//     setLocationStatus("Opening camera for selfie...");
//     // fileInputRef.current?.click();
//     setShowCameraModal(true);
//   }, [
//     isProcessing,
//     loading,
//     isButtonDisabled,
//     record,
//     userLocation,
//     isBeforeExpectedCheckIn,
//     isAfterExpectedCheckOut,
//     expectedTimings,
//   ]);

//   const handleSelfieCapture = useCallback(
//     async (e: React.ChangeEvent<HTMLInputElement>) => {
//       const file = e.target.files?.[0];
//       if (!file) {
//         setLocationStatus("Selfie capture cancelled.");
//         setIsProcessing(false);
//         if (e.target) (e.target as HTMLInputElement).value = "";
//         return;
//       }
//       if (!userLocation) {
//         setLocationStatus("Location data lost. Please try again.");
//         setIsProcessing(false);
//         if (e.target) (e.target as HTMLInputElement).value = "";
//         return;
//       }
//       setIsProcessing(true);
//       setLocationStatus("Uploading selfie and initiating check-in...");
//       try {
//         const uploadRes = await uploadFile(file);
//         if (!uploadRes.ok || !uploadRes.data.fileUrl) {
//           setLocationStatus(
//             `❌ Selfie Upload Failed: ${
//               uploadRes.data.message || "Server error."
//             }`
//           );
//           return;
//         }
//         const { fileUrl } = uploadRes.data;
//         const checkInRes = await postData(`${API_BASE_URL}/check-in`, {
//           userLat: userLocation.latitude,
//           userLong: userLocation.longitude,
//           selfieUrl: fileUrl,
//         });
//         if (checkInRes.ok) {
//           setLocationStatus(`✅ Check-In Success!`);
//           await fetchAttendanceRecord();
//           await fetchAttendanceHistory();
//         } else {
//           setLocationStatus(
//             `❌ Check-In Failed: ${checkInRes.data.message || "Server error."}`
//           );
//         }
//       } catch (error) {
//         setLocationStatus("Network error during check-in.");
//       } finally {
//         setIsProcessing(false);
//         if (e.target) (e.target as HTMLInputElement).value = "";
//       }
//     },
//     [userLocation, fetchAttendanceRecord, fetchAttendanceHistory]
//   );

//   const handleSelfieCaptureFromCamera = async (file: File) => {
//     if (!userLocation) {
//       setLocationStatus("Location data lost. Please try again.");
//       return;
//     }
//     setIsProcessing(true);
//     setLocationStatus("Uploading selfie and initiating check-in...");
//     try {
//       const uploadRes = await uploadFile(file);
//       if (!uploadRes.ok || !uploadRes.data.fileUrl) {
//         setLocationStatus(
//           `❌ Upload Failed: ${uploadRes.data.message || "Server error."}`
//         );
//         return;
//       }
//       const { fileUrl } = uploadRes.data;
//       const checkInRes = await postData(`${API_BASE_URL}/check-in`, {
//         userLat: userLocation.latitude,
//         userLong: userLocation.longitude,
//         selfieUrl: fileUrl,
//       });
//       if (checkInRes.ok) {
//         setLocationStatus(`✅ Check-In Success!`);
//         await fetchAttendanceRecord();
//         await fetchAttendanceHistory();
//       } else {
//         setLocationStatus(
//           `❌ Check-In Failed: ${checkInRes.data.message || "Server error."}`
//         );
//       }
//     } catch (error) {
//       setLocationStatus("Network error during check-in.");
//     } finally {
//       setIsProcessing(false);
//     }
//     // setShowCameraModal(false);
//   };

//   const handleCheckOut = useCallback(async () => {
//     // Determine if check-out should be blocked
//     // const isCheckOutBlocked =
//     //   isProcessing ||
//     //   loading ||
//     //   !record?.CheckInAt ||
//     //   !!record?.CheckOutAt || // Already checked out
//     //   isBeforeExpectedCheckOut; // Too early based on expected time

//     if (isCheckOutBlocked) {
//       let statusMessage = "Check-out blocked.";
//       if (isBeforeExpectedCheckOut) {
//         const expectedTimeDisplay = formatTime(
//           expectedTimings?.ExpectedCheckOut || "18:00:00" // Default fallback time
//         );
//         statusMessage = `❌ Check-Out blocked. You must wait until ${expectedTimeDisplay} (Expected Check-Out Time) to log out.`;
//       } else if (!record?.CheckInAt) {
//         statusMessage = "❌ Check-Out blocked. You must check in first.";
//       } else if (!!record?.CheckOutAt) {
//         statusMessage = "❌ Check-Out blocked. Already checked out for today.";
//       }
//       setLocationStatus(statusMessage);
//       return;
//     }

//     console.log("handleCheckOut called. Current record:", record); // Log 1: Initial state

//     setIsProcessing(true);
//     setLocationStatus("Sending check-out request...");
//     try {
//       const result = await postData(`${API_BASE_URL}/check-out`, {});
//       if (result.ok) {
//         setLocationStatus(`✅ Check-Out Success!`);
//         console.log("Check-out API Success."); // Log 2: API result

//         // --- OPTIMISTIC UPDATE ---
//         const optimisticCheckOutTime = new Date().toISOString(); // Store the current time
//         setRecord((prevRecord) => {
//           console.log(
//             "Optimistic setRecord START. Prev CheckOutAt:",
//             prevRecord?.CheckOutAt
//           ); // Log 3
//           if (!prevRecord) return null; // Should ideally not happen if button was enabled
//           const updatedRecord = {
//             ...prevRecord,
//             CheckOutAt: optimisticCheckOutTime, // Use the stored optimistic time
//           };
//           console.log(
//             "Optimistic setRecord END. New CheckOutAt:",
//             updatedRecord.CheckOutAt
//           ); // Log 4
//           return updatedRecord;
//         });
//         // --- END OPTIMISTIC UPDATE ---

//         // Fetch fresh data from the server afterwards to get the exact time
//         console.log("Calling fetchAttendanceRecord..."); // Log 5
//         await fetchAttendanceRecord();
//         console.log("fetchAttendanceRecord FINISHED."); // Log 6
//         await fetchAttendanceHistory(); // Keep history fetch as well
//       } else {
//         setLocationStatus(
//           `❌ Check-Out Failed: ${result.data.message || "Server error."}`
//         );
//         console.error("Check-out API Failed:", result.data); // Log API error
//       }
//     } catch (error) {
//       setLocationStatus("Network error during check-out.");
//       console.error("Network error in handleCheckOut:", error); // Log network error
//     } finally {
//       setIsProcessing(false);
//     }
//   }, [
//     isProcessing,
//     loading,
//     record,
//     isBeforeExpectedCheckOut,
//     expectedTimings,
//     setLocationStatus,
//     setIsProcessing,
//     setRecord,
//     fetchAttendanceRecord,
//     fetchAttendanceHistory,
//   ]);

//   useEffect(() => {
//     console.log("Record state CHANGED:", record); // Log 7: See state after any update
//   }, [record]);

//   // const isCheckOutBlockedForButton = // Re-calculate or ensure scope allows access to the button's value
//   //   isProcessing ||
//   //   loading ||
//   //   !record?.CheckInAt ||
//   //   !!record?.CheckOutAt ||
//   //   isBeforeExpectedCheckOut;

//   // useEffect(() => {
//   //   console.log(
//   //     "isCheckOutBlocked state calculated:",
//   //     isCheckOutBlockedForButton,
//   //     "|| CheckOutAt:",
//   //     record?.CheckOutAt
//   //   ); // Log 8: See derived state changes
//   // }, [isProcessing, loading, record, isBeforeExpectedCheckOut]);
//   useEffect(() => {
//     console.log(
//       "isCheckOutBlocked (from useMemo) state calculated:",
//       isCheckOutBlocked, // <-- Now logs the REAL variable
//       "|| CheckOutAt:",
//       record?.CheckOutAt
//     );
//   }, [isCheckOutBlocked, record?.CheckOutAt]);

//   const handleBreakIn = useCallback(async () => {
//     setIsProcessing(true);
//     setLocationStatus("Sending break-in request...");
//     try {
//       const result = await postData(`${API_BASE_URL}/break-in`, {});
//       if (result.ok) {
//         setLocationStatus(`✅ Break-In Success!`);
//         await fetchAttendanceRecord();
//         await fetchAttendanceHistory();
//       } else {
//         setLocationStatus(
//           `❌ Break-In Failed: ${result.data.message || "Server error."}`
//         );
//       }
//     } catch (error) {
//       setLocationStatus("Network error during break-in.");
//     } finally {
//       setIsProcessing(false);
//     }
//   }, [fetchAttendanceRecord, fetchAttendanceHistory]);

//   const handleBreakOut = useCallback(async () => {
//     setIsProcessing(true);
//     setLocationStatus("Sending break-out request...");
//     try {
//       const result = await postData(`${API_BASE_URL}/break-out`, {});
//       if (result.ok) {
//         setLocationStatus(`✅ Break-Out Success!`);
//         await fetchAttendanceRecord();
//         await fetchAttendanceHistory();
//       } else {
//         setLocationStatus(
//           `❌ Break-Out Failed: ${result.data.message || "Server error."}`
//         );
//       }
//     } catch (error) {
//       setLocationStatus("Network error during break-out.");
//     } finally {
//       setIsProcessing(false);
//     }
//   }, [fetchAttendanceRecord, fetchAttendanceHistory]);

//   const refreshAll = useCallback(() => {
//     fetchAttendanceRecord();
//     fetchAttendanceHistory();
//     fetchQueries();
//     fetchExpectedTimings();
//   }, [
//     fetchAttendanceRecord,
//     fetchAttendanceHistory,
//     fetchQueries,
//     fetchExpectedTimings,
//   ]);

//   const handleSubmitQuery = useCallback(async () => {
//     if (!querySubject.trim() || !queryMessage.trim()) {
//       setQueryStatus("❌ Subject and message are required.");
//       return;
//     }
//     setIsSubmittingQuery(true);
//     setQueryStatus("Submitting your query...");
//     try {
//       let proofUrl = null;
//       if (queryProofFile) {
//         const formData = new FormData();
//         formData.append("selfie", queryProofFile);
//         const token = window.localStorage?.getItem("token");
//         const uploadRes = await fetch(`${API_BASE_URL}/upload-selfie`, {
//           method: "POST",
//           headers: {
//             ...(token && { Authorization: `Bearer ${token}` }),
//           },
//           body: formData,
//         });
//         const uploadData = await uploadRes.json();
//         if (uploadRes.ok && uploadData.fileUrl) {
//           proofUrl = uploadData.fileUrl;
//         } else {
//           setQueryStatus("❌ Failed to upload proof file.");
//           setIsSubmittingQuery(false);
//           return;
//         }
//       }
//       const queryData = {
//         subject: querySubject,
//         message: queryMessage,
//         proofurl: proofUrl,
//       };
//       const result = await postData(`${API_BASE_URL}/query`, queryData);
//       if (result.ok) {
//         setQueryStatus("✅ Query submitted successfully!");
//         setQuerySubject("");
//         setQueryMessage("");
//         setQueryProofFile(null);
//         if (proofInputRef.current) proofInputRef.current.value = "";
//         await fetchQueries();
//         setTimeout(() => setShowQueryForm(false), 1500);
//       } else {
//         setQueryStatus(
//           `❌ Query submission failed: ${
//             result.data.message || "Server error."
//           }`
//         );
//       }
//     } catch (error) {
//       setQueryStatus("❌ Network error during query submission.");
//     } finally {
//       setIsSubmittingQuery(false);
//     }
//   }, [querySubject, queryMessage, queryProofFile, fetchQueries]);

//   const handleProofFileChange = useCallback(
//     (e: React.ChangeEvent<HTMLInputElement>) => {
//       const file = e.target.files?.[0];
//       if (file) {
//         setQueryProofFile(file);
//       }
//     },
//     []
//   );

//   const formatToISOLocal = (date: Date): string => {
//     const pad = (num: number) => num.toString().padStart(2, "0");
//     const year = date.getFullYear();
//     const month = pad(date.getMonth() + 1);
//     const day = pad(date.getDate());
//     const hours = pad(date.getHours());
//     const minutes = pad(date.getMinutes());
//     return `${year}-${month}-${day}T${hours}:${minutes}`;
//   };

//   const handleEditCheckIn = useCallback(async () => {
//     if (!record || !record.CheckInAt || !record.AttendanceId) {
//       setLocationStatus("❌ No Check-In record to edit.");
//       return;
//     }

//     const currentCheckIn = new Date(record.CheckInAt);
//     const defaultValue = formatToISOLocal(currentCheckIn);

//     const newTimeStr = window.prompt("Enter new Check-In time:", defaultValue);

//     if (!newTimeStr) return; // User cancelled

//     const newTime = new Date(newTimeStr);
//     if (isNaN(newTime.getTime())) {
//       setLocationStatus("❌ Invalid date format.");
//       return;
//     }

//     setIsProcessing(true);
//     setLocationStatus("Updating Check-In time...");
//     const res = await patchData(
//       `${API_BASE_URL}/record/${record.AttendanceId}/check-in`,
//       { newCheckInTime: newTime.toISOString() }
//     );

//     if (res.ok) {
//       setLocationStatus("✅ Check-In time updated!");
//       await fetchAttendanceRecord(); // Refresh data
//     } else {
//       setLocationStatus(
//         `❌ Update failed: ${res.data.message || "Server error."}`
//       );
//     }
//     setIsProcessing(false);
//   }, [record, fetchAttendanceRecord]);

//   const handleEditCheckOut = useCallback(async () => {
//     if (!record || !record.CheckOutAt || !record.AttendanceId) {
//       setLocationStatus("❌ No Check-Out record to edit.");
//       return;
//     }

//     const currentCheckOut = new Date(record.CheckOutAt);
//     const defaultValue = formatToISOLocal(currentCheckOut);

//     const newTimeStr = window.prompt("Enter new Check-Out time:", defaultValue);

//     if (!newTimeStr) return; // User cancelled

//     const newTime = new Date(newTimeStr);
//     if (isNaN(newTime.getTime())) {
//       setLocationStatus("❌ Invalid date format.");
//       return;
//     }

//     setIsProcessing(true);
//     setLocationStatus("Updating Check-Out time...");
//     const res = await patchData(
//       `${API_BASE_URL}/record/${record.AttendanceId}/check-out`,
//       { newCheckOutTime: newTime.toISOString() }
//     );

//     if (res.ok) {
//       setLocationStatus("✅ Check-Out time updated!");
//       await fetchAttendanceRecord(); // Refresh data
//     } else {
//       setLocationStatus(
//         `❌ Update failed: ${res.data.message || "Server error."}`
//       );
//     }
//     setIsProcessing(false);
//   }, [record, fetchAttendanceRecord]);

//   ///========================================================
//   // --- NEW: Hook to calculate if user is on leave ---
//   // const isOnLeaveToday = useMemo(() => {
//   //   if (!availability) return false;
//   //   if (availability.availabilityStatus !== "OnLeave") return false;
//   //   const today = new Date();
//   //   const start = availability.leaveStartDate
//   //     ? new Date(availability.leaveStartDate)
//   //     : null;
//   //   const end = availability.leaveEndDate
//   //     ? new Date(availability.leaveEndDate)
//   //     : null;

//   //   // Normalize dates to ignore time
//   //   const normalizedToday = new Date(today.toDateString());
//   //   const normalizedStart = start ? new Date(start.toDateString()) : null;
//   //   const normalizedEnd = end ? new Date(end.toDateString()) : null;

//   //   const inRange =
//   //     (!normalizedStart || normalizedToday >= normalizedStart) &&
//   //     (!normalizedEnd || normalizedToday <= normalizedEnd);

//   //   return inRange;
//   // }, [availability]);
//   // // --- END NEW HOOK ---

//   // // --- MODIFIED: `isOnLeaveToday` is now included ---
//   // // const isCheckInBlocked =
//   // //   isProcessing ||
//   // //   loading ||
//   // //   isButtonDisabled ||
//   // //   !!record?.CheckInAt ||
//   // //   isBeforeExpectedCheckIn ||
//   // //   isAfterExpectedCheckOut ||
//   // //   isOnLeaveToday;

//   // // // --- MODIFIED: `isOnLeaveToday` is now included ---
//   // // const isCheckOutBlocked =
//   // //   isProcessing ||
//   // //   loading ||
//   // //   !record?.CheckInAt ||
//   // //   !!record?.CheckOutAt ||
//   // //   isBeforeExpectedCheckOut ||
//   // //   isOnLeaveToday;

//   // const isCheckInBlocked = useMemo(() => {
//   //   return (
//   //     isProcessing ||
//   //     loading ||
//   //     isButtonDisabled || // Location check
//   //     !!record?.CheckInAt || // Already checked in
//   //     isBeforeExpectedCheckIn || // Too early
//   //     isAfterExpectedCheckOut || // Too late
//   //     isOnLeaveToday // On leave
//   //   );
//   // }, [
//   //   isProcessing,
//   //   loading,
//   //   isButtonDisabled,
//   //   record?.CheckInAt,
//   //   isBeforeExpectedCheckIn,
//   //   isAfterExpectedCheckOut,
//   //   isOnLeaveToday,
//   // ]);

//   // const isCheckOutBlocked = useMemo(() => {
//   //   return (
//   //     isProcessing ||
//   //     loading ||
//   //     !record?.CheckInAt || // Not checked in yet
//   //     !!record?.CheckOutAt || // Already checked out
//   //     isBeforeExpectedCheckOut || // Too early
//   //     isOnLeaveToday // On leave
//   //   );
//   // }, [
//   //   isProcessing,
//   //   loading,
//   //   record?.CheckInAt,
//   //   record?.CheckOutAt,
//   //   isBeforeExpectedCheckOut,
//   //   isOnLeaveToday,
//   // ]);

//   ///========================================================
//   // --- Hook to calculate if user is on leave ---
//   const isOnLeaveToday = useMemo(() => {
//     if (!availability) return false;
//     if (availability.availabilityStatus !== "OnLeave") return false;
//     const today = new Date();
//     const start = availability.leaveStartDate
//       ? new Date(availability.leaveStartDate)
//       : null;
//     const end = availability.leaveEndDate
//       ? new Date(availability.leaveEndDate)
//       : null;

//     // Normalize dates to ignore time
//     const normalizedToday = new Date(today.toDateString());
//     const normalizedStart = start ? new Date(start.toDateString()) : null;
//     const normalizedEnd = end ? new Date(end.toDateString()) : null;

//     const inRange =
//       (!normalizedStart || normalizedToday >= normalizedStart) &&
//       (!normalizedEnd || normalizedToday <= normalizedEnd);

//     return inRange;
//   }, [availability]);

//   // --- NEW: Off day check using OffDaysMask from expected timings ---
//   const isOffDayToday = useMemo(() => {
//     if (!expectedTimings || typeof expectedTimings.OffDaysMask !== "number")
//       return false;

//     const mask = expectedTimings.OffDaysMask;
//     const dow = new Date().getDay(); // 0 = Sunday ... 6 = Saturday

//     // This is the bitwise check. (mask & (1 << dow)) will be non-zero if the bit for today is set.
//     return (mask & (1 << dow)) !== 0;
//   }, [expectedTimings]);

//   const isCheckInBlocked = useMemo(() => {
//     return (
//       isProcessing ||
//       loading ||
//       isButtonDisabled || // Location check
//       !!record?.CheckInAt || // Already checked in
//       isBeforeExpectedCheckIn || // Too early
//       isAfterExpectedCheckOut || // Too late
//       isOnLeaveToday || // On leave
//       isOffDayToday // <-- ADDED: Weekly off day
//     );
//   }, [
//     isProcessing,
//     loading,
//     isButtonDisabled,
//     record?.CheckInAt,
//     isBeforeExpectedCheckIn,
//     isAfterExpectedCheckOut,
//     isOnLeaveToday,
//     isOffDayToday, // <-- ADDED
//   ]);

//   const isCheckOutBlocked = useMemo(() => {
//     return (
//       isProcessing ||
//       loading ||
//       !record?.CheckInAt || // Not checked in yet
//       !!record?.CheckOutAt || // Already checked out
//       isBeforeExpectedCheckOut || // Too early
//       isOnLeaveToday || // On leave
//       isOffDayToday // <-- ADDED: Weekly off day
//     );
//   }, [
//     isProcessing,
//     loading,
//     record?.CheckInAt,
//     record?.CheckOutAt,
//     isBeforeExpectedCheckOut,
//     isOnLeaveToday,
//     isOffDayToday, // <-- ADDED
//   ]);

//   const currentDuration = useMemo(() => {
//     if (!record || !record.CheckInAt) return "00:00";
//     return calculateDuration(record.CheckInAt, record.CheckOutAt);
//   }, [record]);

//   const currentBreakDuration = useMemo(() => {
//     if (!record || !record.BreakInAt) return "00:00";
//     return calculateDuration(record.BreakInAt, record.BreakOutAt);
//   }, [record]);

//   const getStatusBadge = (status: string) => {
//     const statusColors: Record<string, string> = {
//       Pending:
//         "bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border-yellow-300",
//       Resolved:
//         "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300",
//       Rejected:
//         "bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border-red-300",
//     };
//     return (
//       statusColors[status] ||
//       "bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-300"
//     );
//   };

//   // Place this function inside the AttendancePage component, before the return()

//   const saveAvailability = async () => {
//     const uid = getCurrentUserId(); // Use your existing function
//     if (!uid || !availability) return;
//     setIsSavingAvailability(true);
//     try {
//       const resp = await fetch(`${USER_API_BASE_URL}/${uid}/availability`, {
//         method: "PATCH",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//         },
//         body: JSON.stringify({
//           isAvailable: availability.availabilityStatus === "Available",
//           availabilityStatus: availability.availabilityStatus,
//           leaveStartDate: availability.leaveStartDate,
//           leaveEndDate: availability.leaveEndDate,
//         }),
//       });
//       const data = await resp.json();
//       if (!resp.ok)
//         throw new Error(data?.message || "Failed to save availability");

//       // Success: show confirmation to user
//       setLocationStatus("✅ Availability status saved!");
//     } catch (e: any) {
//       // Catch as 'any' or 'Error' to access 'message'
//       console.error(e);
//       // Display the specific error message from the catch block
//       setLocationStatus(`❌ Failed to update availability: ${e.message}`);
//     } finally {
//       setIsSavingAvailability(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-8">
//       <div className="max-w-5xl mx-auto space-y-6">
//         {/* Header */}
//         <div className="bg-white rounded-2xl shadow-2xl p-6 border border-indigo-100 backdrop-blur-lg bg-opacity-90">
//           <div className="flex items-center justify-between">
//             <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
//               <Clock className="w-8 h-8 text-indigo-600 animate-pulse" />
//               Attendance Portal
//             </h1>
//             <Button
//               variant="secondary"
//               onClick={refreshAll}
//               className="px-4 py-2"
//               disabled={isProcessing || loading}
//             >
//               <RefreshCw
//                 className={`w-5 h-5 ${
//                   isProcessing || loading ? "animate-spin" : ""
//                 }`}
//               />
//             </Button>
//           </div>
//         </div>

//         {/* --- NEW: Availability Control Card --- */}
//         <div className="bg-white p-5 rounded-2xl shadow-lg mb-6 border border-gray-200">
//           <h3 className="text-lg font-semibold text-gray-800 mb-3">
//             Availability
//           </h3>
//           {availability ? (
//             <>
//               <div className="flex flex-col sm:flex-row gap-4">
//                 <div className="flex-1">
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Status
//                   </label>
//                   <select
//                     className="mt-1 block w-full px-3 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
//                     value={availability.availabilityStatus}
//                     onChange={(e) =>
//                       setAvailability((prev) =>
//                         prev
//                           ? {
//                               ...prev,
//                               availabilityStatus: e.target.value as any,
//                               isAvailable: e.target.value === "Available",
//                             }
//                           : prev
//                       )
//                     }
//                   >
//                     <option value="Available">Available</option>
//                     <option value="OnLeave">On Leave</option>
//                     <option value="Sick">Sick</option>
//                     <option value="Unavailable">Unavailable</option>
//                   </select>
//                 </div>

//                 {availability.availabilityStatus === "OnLeave" && (
//                   <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">
//                         Leave Start Date
//                       </label>
//                       <input
//                         type="date"
//                         className="mt-1 block w-full px-3 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
//                         value={
//                           availability.leaveStartDate
//                             ? availability.leaveStartDate.substring(0, 10)
//                             : ""
//                         }
//                         onChange={(e) =>
//                           setAvailability((prev) =>
//                             prev
//                               ? {
//                                   ...prev,
//                                   leaveStartDate: e.target.value || null,
//                                 }
//                               : prev
//                           )
//                         }
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">
//                         Leave End Date
//                       </label>
//                       <input
//                         type="date"
//                         className="mt-1 block w-full px-3 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
//                         value={
//                           availability.leaveEndDate
//                             ? availability.leaveEndDate.substring(0, 10)
//                             : ""
//                         }
//                         onChange={(e) =>
//                           setAvailability((prev) =>
//                             prev
//                               ? {
//                                   ...prev,
//                                   leaveEndDate: e.target.value || null,
//                                 }
//                               : prev
//                           )
//                         }
//                       />
//                     </div>
//                   </div>
//                 )}
//               </div>

//               <div className="mt-4 flex justify-end">
//                 <button
//                   className="px-4 py-2 rounded-lg bg-indigo-600 text-white disabled:opacity-60"
//                   onClick={saveAvailability}
//                   disabled={isSavingAvailability}
//                 >
//                   {isSavingAvailability ? "Saving..." : "Save"}
//                 </button>
//               </div>
//             </>
//           ) : (
//             <div className="text-gray-500 text-sm">Loading availability...</div>
//           )}
//         </div>
//         {/* --- END: Availability Control Card --- */}

//         {/* Location Status Card (Updated with Expected Time Status) */}
//         <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 backdrop-blur-lg bg-opacity-90 transform hover:scale-[1.02] transition-all duration-300">
//           <div className="flex items-start gap-4">
//             <div
//               className={`p-3 rounded-xl ${
//                 isButtonDisabled ? "bg-red-100" : "bg-green-100"
//               }`}
//             >
//               <MapPin
//                 className={`w-6 h-6 ${
//                   isButtonDisabled ? "text-red-600" : "text-green-600"
//                 }`}
//               />
//             </div>
//             <div className="flex-1">
//               <p className="text-sm font-semibold text-gray-600 mb-1">
//                 Live Location Status
//               </p>
//               <p
//                 className={`text-lg font-bold ${
//                   isButtonDisabled ? "text-red-600" : "text-green-600"
//                 }`}
//               >
//                 {locationStatus}
//               </p>
//             </div>
//           </div>
//           {/* NEW: Expected Time Status Display */}
//           {expectedTimings &&
//             (isBeforeExpectedCheckIn || isAfterExpectedCheckOut) && (
//               <div className="mt-4 p-3 bg-red-50 border border-red-300 rounded-lg">
//                 <p className="text-sm text-red-700 font-semibold flex items-center gap-2">
//                   <Clock className="w-4 h-4" />
//                   Attendance Blocked
//                 </p>
//                 {isBeforeExpectedCheckIn && (
//                   <p className="text-xs text-red-600 mt-1">
//                     Check-In Not Allowed Yet. Expected Check-In Time: **
//                     {formatTime(expectedTimings.ExpectedCheckIn)}**.
//                   </p>
//                 )}
//                 {isAfterExpectedCheckOut && (
//                   <p className="text-xs text-red-600 mt-1">
//                     Check-In/Check-Out window has closed. Expected Check-Out
//                     Time: **{formatTime(expectedTimings.ExpectedCheckOut)}**.
//                   </p>
//                 )}
//               </div>
//             )}
//         </div>

//         {/* Today's Record Card */}
//         <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 backdrop-blur-lg bg-opacity-90">
//           <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-gray-800">
//             <Calendar className="w-6 h-6 text-indigo-600" />
//             Today's Record
//           </h2>
//           {loading ? (
//             <div className="text-gray-500 flex items-center justify-center p-8">
//               <RefreshCw className="w-6 h-6 animate-spin mr-3" />
//               <span className="text-lg">Loading...</span>
//             </div>
//           ) : (
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//               <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border-2 border-green-200 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
//                 <p className="text-sm font-semibold text-gray-600 mb-2">
//                   Check-in Time
//                 </p>
//                 <p className="text-3xl font-extrabold text-green-700">
//                   {formatTime(record?.CheckInAt)}
//                 </p>
//               </div>

//               <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-5 border-2 border-red-200 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
//                 <p className="text-sm font-semibold text-gray-600 mb-2">
//                   Check-out Time
//                 </p>

//                 <p className="text-3xl font-extrabold text-red-700">
//                   {formatTime(record?.CheckOutAt)}
//                 </p>
//               </div>

//               <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border-2 border-blue-200 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
//                 <p className="text-sm font-semibold text-gray-600 mb-2">
//                   Total Duration
//                 </p>
//                 <p className="text-3xl font-extrabold text-blue-700">
//                   {currentDuration}
//                 </p>
//               </div>

//               <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border-2 border-green-200 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
//                 <p className="text-sm font-semibold text-gray-600 mb-2">
//                   Break-In Time
//                 </p>
//                 <p className="text-3xl font-extrabold text-green-700">
//                   {formatTime(record?.BreakInAt)}
//                 </p>
//               </div>

//               <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-5 border-2 border-red-200 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
//                 <p className="text-sm font-semibold text-gray-600 mb-2">
//                   Break-out Time
//                 </p>
//                 <p className="text-3xl font-extrabold text-red-700">
//                   {formatTime(record?.BreakOutAt)}
//                 </p>
//               </div>

//               <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border-2 border-blue-200 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
//                 <p className="text-sm font-semibold text-gray-600 mb-2">
//                   Total Duration
//                 </p>
//                 <p className="text-3xl font-extrabold text-blue-700">
//                   {currentBreakDuration}
//                 </p>
//               </div>
//             </div>
//           )}
//         </div>

//         {/* --- NEW: "On Leave" Banner --- */}
//         {isOnLeaveToday && (
//           <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
//             You are marked as On Leave today. All attendance actions are
//             disabled.
//           </div>
//         )}
//         {/* --- END: "On Leave" Banner --- */}

//         {/* --- ADD THIS NEW BANNER --- */}
//         {isOffDayToday && !isOnLeaveToday && (
//           <div className="mb-4 rounded-lg border border-gray-300 bg-gray-100 p-3 text-sm text-gray-800">
//             Today is your scheduled weekly off day. All attendance actions are
//             disabled.
//           </div>
//         )}
//         {/* Action Buttons */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <Button
//             onClick={handleCheckIn}
//             disabled={isCheckInBlocked}
//             variant="success"
//             className="w-full py-4 text-lg"
//           >
//             {isProcessing && !record?.CheckInAt ? (
//               <span className="flex items-center justify-center gap-2">
//                 <RefreshCw className="w-5 h-5 animate-spin" />
//                 Checking In...
//               </span>
//             ) : (
//               <span className="flex items-center justify-center gap-2">
//                 <CheckCircle className="w-5 h-5" />
//                 Check In
//               </span>
//             )}
//           </Button>

//           <Button
//             variant="danger"
//             onClick={handleCheckOut}
//             disabled={isCheckOutBlocked}
//             className="w-full py-4 text-lg"
//           >
//             {isProcessing && record?.CheckInAt && !record?.CheckOutAt ? (
//               <span className="flex items-center justify-center gap-2">
//                 <RefreshCw className="w-5 h-5 animate-spin" />
//                 Checking Out...
//               </span>
//             ) : (
//               <span className="flex items-center justify-center gap-2">
//                 <XCircle className="w-5 h-5" />
//                 Check Out
//               </span>
//             )}
//           </Button>
//         </div>
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <Button
//             onClick={handleBreakIn}
//             disabled={record?.BreakInAt || isOnLeaveToday}
//           >
//             Break In
//           </Button>
//           <Button
//             onClick={handleBreakOut}
//             disabled={
//               !record?.BreakInAt || record?.BreakOutAt || isOnLeaveToday
//             }
//           >
//             Break Out
//           </Button>
//         </div>

//         {showCameraModal && (
//           <CameraModal
//             onCapture={handleSelfieCaptureFromCamera}
//             onClose={() => setShowCameraModal(false)}
//           />
//         )}

//         {/* Attendance History */}
//         <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 backdrop-blur-lg bg-opacity-90">
//           <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
//             <Calendar className="w-6 h-6 text-indigo-600" />
//             Attendance History
//           </h2>
//           {historyLoading ? (
//             <div className="text-gray-500 flex items-center justify-center p-8">
//               <RefreshCw className="w-6 h-6 animate-spin mr-3" />
//               <span>Loading History...</span>
//             </div>
//           ) : history.length === 0 ? (
//             <p className="text-gray-500 p-6 bg-gray-50 rounded-xl text-center">
//               No records found.
//             </p>
//           ) : (
//             <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
//               {history.map((hist, index) => (
//                 <div
//                   key={hist.WorkDate || index}
//                   className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]"
//                 >
//                   <div className="flex flex-col mb-3 md:mb-0">
//                     <span className="font-bold text-lg text-indigo-600">
//                       {formatDate(hist.WorkDate)}
//                     </span>
//                     <span className="text-sm text-gray-500 flex items-center gap-1 mt-1">
//                       <Clock className="w-4 h-4" />
//                       {calculateDuration(hist.CheckInAt, hist.CheckOutAt)} Total
//                     </span>
//                   </div>
//                   <div className="flex gap-6 text-sm">
//                     <div className="flex flex-col items-center bg-green-50 px-4 py-2 rounded-lg border border-green-200">
//                       <CheckCircle className="w-5 h-5 text-green-600 mb-1" />
//                       <span className="text-xs text-gray-500">In</span>
//                       <span className="font-bold text-green-700">
//                         {formatTime(hist.CheckInAt)}
//                       </span>
//                     </div>
//                     <div
//                       className={`flex flex-col items-center px-4 py-2 rounded-lg border ${
//                         hist.CheckOutAt
//                           ? "bg-red-50 border-red-200"
//                           : "bg-yellow-50 border-yellow-200"
//                       }`}
//                     >
//                       <XCircle
//                         className={`w-5 h-5 mb-1 ${
//                           hist.CheckOutAt ? "text-red-600" : "text-yellow-600"
//                         }`}
//                       />
//                       <span className="text-xs text-gray-500">Out</span>
//                       <span
//                         className={`font-bold ${
//                           hist.CheckOutAt ? "text-red-700" : "text-yellow-700"
//                         }`}
//                       >
//                         {formatTime(hist.CheckOutAt)}
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         {/* Query Section */}
//         <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 backdrop-blur-lg bg-opacity-90">
//           <div className="flex items-center justify-between mb-6">
//             <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
//               <MessageSquare className="w-6 h-6 text-indigo-600" />
//               Support Queries
//             </h2>
//             <Button
//               onClick={() => setShowQueryForm(!showQueryForm)}
//               className="px-4 py-2"
//             >
//               {showQueryForm ? "Hide Form" : "Raise Query"}
//             </Button>
//           </div>

//           {showQueryForm && (
//             <div className="mb-6 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-6 space-y-4 animate-in">
//               <div>
//                 <label className="block text-sm font-bold text-gray-700 mb-2">
//                   Subject *
//                 </label>
//                 <input
//                   type="text"
//                   value={querySubject}
//                   onChange={(e) => setQuerySubject(e.target.value)}
//                   placeholder="e.g., Forgot to Check Out"
//                   className="w-full px-4 py-3 border-2 border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
//                   disabled={isSubmittingQuery}
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-bold text-gray-700 mb-2">
//                   Message *
//                 </label>
//                 <textarea
//                   value={queryMessage}
//                   onChange={(e) => setQueryMessage(e.target.value)}
//                   placeholder="Describe your query in detail..."
//                   rows={4}
//                   className="w-full px-4 py-3 border-2 border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all duration-300"
//                   disabled={isSubmittingQuery}
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
//                   <Paperclip className="w-4 h-4" />
//                   Attach Proof (Optional)
//                 </label>
//                 <input
//                   type="file"
//                   accept="image/*"
//                   ref={proofInputRef}
//                   onChange={handleProofFileChange}
//                   className="w-full text-sm text-gray-600 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 file:cursor-pointer transition-all duration-300"
//                   disabled={isSubmittingQuery}
//                 />
//                 {queryProofFile && (
//                   <p className="text-sm text-green-600 mt-2 flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg">
//                     <CheckCircle className="w-4 h-4" />
//                     {queryProofFile.name}
//                   </p>
//                 )}
//               </div>

//               {queryStatus && (
//                 <div
//                   className={`p-4 rounded-xl font-medium ${
//                     queryStatus.includes("✅")
//                       ? "bg-green-100 text-green-800"
//                       : "bg-red-100 text-red-800"
//                   }`}
//                 >
//                   {queryStatus}
//                 </div>
//               )}

//               <Button
//                 onClick={handleSubmitQuery}
//                 disabled={
//                   isSubmittingQuery ||
//                   !querySubject.trim() ||
//                   !queryMessage.trim()
//                 }
//                 className="w-full py-3 text-lg"
//               >
//                 {isSubmittingQuery ? (
//                   <span className="flex items-center justify-center gap-2">
//                     <RefreshCw className="w-5 h-5 animate-spin" />
//                     Submitting...
//                   </span>
//                 ) : (
//                   "Submit Query"
//                 )}
//               </Button>
//             </div>
//           )}

//           {/* Query History */}
//           <div>
//             <h3 className="text-lg font-bold text-gray-700 mb-4 border-b-2 border-gray-200 pb-2">
//               Your Query History
//             </h3>
//             {queriesLoading ? (
//               <div className="text-gray-500 flex items-center justify-center p-8">
//                 <RefreshCw className="w-6 h-6 animate-spin mr-3" />
//                 <span>Loading Queries...</span>
//               </div>
//             ) : queries.length === 0 ? (
//               <p className="text-gray-500 p-6 bg-gray-50 rounded-xl text-center">
//                 No queries submitted yet.
//               </p>
//             ) : (
//               <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
//                 {queries.map((query) => (
//                   <div
//                     key={query.QueryId}
//                     className="bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 rounded-xl p-5 shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-[1.01]"
//                   >
//                     <div className="flex flex-col md:flex-row justify-between items-start gap-3 mb-3">
//                       <div className="flex-1">
//                         <h3 className="font-bold text-gray-800 text-lg mb-1">
//                           {query.Subject}
//                         </h3>
//                         <p className="text-xs text-gray-400 flex items-center gap-1">
//                           <Clock className="w-3 h-3" />
//                           {formatDateTime(query.RaisedAt)}
//                         </p>
//                       </div>
//                       <span
//                         className={`px-4 py-2 rounded-full text-xs font-bold border-2 ${getStatusBadge(
//                           query.Status
//                         )} shadow-sm`}
//                       >
//                         {query.Status}
//                       </span>
//                     </div>

//                     <p className="text-sm text-gray-700 mb-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
//                       {query.Message}
//                     </p>

//                     {query.Proofurl && (
//                       <div className="mb-3">
//                         <a
//                           href={query.Proofurl}
//                           target="_blank"
//                           rel="noopener noreferrer"
//                           className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-2 bg-indigo-50 px-3 py-2 rounded-lg w-fit transition-all duration-300 hover:bg-indigo-100"
//                         >
//                           <Paperclip className="w-4 h-4" />
//                           View Attached Proof
//                         </a>
//                       </div>
//                     )}

//                     {query.ResolutionNotes && (
//                       <div className="mt-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl">
//                         <p className="text-xs font-bold text-green-800 mb-2 flex items-center gap-1">
//                           <CheckCircle className="w-4 h-4" />
//                           Resolution Notes:
//                         </p>
//                         <p className="text-sm text-green-700 font-medium">
//                           {query.ResolutionNotes}
//                         </p>
//                       </div>
//                     )}
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
