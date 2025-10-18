"use client";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { RootState } from "@/redux/store";
import { api } from "@/lib/axios";
import {
  requestNotificationPermission,
  showNotification,
} from "@/lib/notifications";

interface RequireAuthProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export function RequireAuth({
  children,
  requiredRoles = [],
}: RequireAuthProps) {
  const { token, user } = useSelector((s: RootState) => s.auth);
  const router = useRouter();

  useEffect(() => {
    console.log("RequireAuth Debug:", { token, user, requiredRoles });

    if (!token) {
      console.log("No token found, redirecting to login");
      router.replace("/login");
      return;
    }

    if (requiredRoles.length > 0 && user) {
      const userRole = user.role?.toLowerCase();
      const hasRequiredRole = requiredRoles.some(
        (role) =>
          userRole === role.toLowerCase() ||
          (userRole === "management" && role.toLowerCase() === "admin")
      );

      if (!hasRequiredRole) {
        router.replace("/unauthorized");
        return;
      }
    }
  }, [token, user, requiredRoles, router]);

  useEffect(() => {
    // This hook runs only once when an authenticated user loads the app.
    // We check for the 'token' to make sure we don't run this
    // before the user is confirmed to be logged in.
    if (token) {
      // 1. Ask for permission (it won't ask if already granted/denied)
      requestNotificationPermission();

      // 2. Define the function to check for tasks
      const checkPendingTasks = async () => {
        try {
          const hasNotified = sessionStorage.getItem("notifiedPendingTasks");
          if (hasNotified) {
            return; // Don't notify again this session
          }

          // 3. Call your universal backend endpoint
          const response = await api.get("/tasks/pending-summary");
          const pendingCount = response.data?.pendingCount || 0;

          if (pendingCount > 0) {
            // 4. If tasks are pending, show the notification
            showNotification(
              "You Have Pending Tasks!",
              `You have ${pendingCount} task(s) awaiting your attention.`
            );

            // 5. Set a flag so we don't spam the user
            sessionStorage.setItem("notifiedPendingTasks", "true");
          }
        } catch (err) {
          console.error("Failed to check for pending tasks:", err);
        }
      };

      // Run the check after a short delay to let the page load
      const timer = setTimeout(checkPendingTasks, 1500);
      return () => clearTimeout(timer);
    }
  }, [token]); // This hook depends on 'token'

  if (!token) return null;
  if (requiredRoles.length > 0 && user) {
    const userRole = user.role?.toLowerCase();
    const hasRequiredRole = requiredRoles.some(
      (role) =>
        userRole === role.toLowerCase() ||
        (userRole === "management" && role.toLowerCase() === "admin")
    );
    if (!hasRequiredRole) return null;
  }

  return <>{children}</>;
}

export default RequireAuth;
