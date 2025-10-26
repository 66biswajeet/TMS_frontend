// "use client";
// import { useSelector } from "react-redux";
// import { useRouter } from "next/navigation";
// import { useEffect } from "react";
// import type { RootState } from "@/redux/store";
// import { api } from "@/lib/axios";
// import {
//   requestNotificationPermission,
//   showNotification,
// } from "@/lib/notifications";

// interface RequireAuthProps {
//   children: React.ReactNode;
//   requiredRoles?: string[];
// }

// export function RequireAuth({
//   children,
//   requiredRoles = [],
// }: RequireAuthProps) {
//   const { token, user } = useSelector((s: RootState) => s.auth);
//   const router = useRouter();

//   useEffect(() => {
//     console.log("RequireAuth Debug:", { token, user, requiredRoles });

//     if (!token) {
//       console.log("No token found, redirecting to login");
//       router.replace("/login");
//       return;
//     }

//     if (requiredRoles.length > 0 && user) {
//       const userRole = user.role?.toLowerCase();
//       const hasRequiredRole = requiredRoles.some(
//         (role) =>
//           userRole === role.toLowerCase() ||
//           (userRole === "management" && role.toLowerCase() === "admin")
//       );

//       if (!hasRequiredRole) {
//         router.replace("/unauthorized");
//         return;
//       }
//     }
//   }, [token, user, requiredRoles, router]);

//   // useEffect(() => {
//   //   // This hook runs only once when an authenticated user loads the app.
//   //   // We check for the 'token' to make sure we don't run this
//   //   // before the user is confirmed to be logged in.
//   //   if (token) {
//   //     // 1. Ask for permission (it won't ask if already granted/denied)
//   //     requestNotificationPermission();

//   //     // 2. Define the function to check for tasks
//   //     const checkPendingTasks = async () => {
//   //       try {
//   //         const hasNotified = sessionStorage.getItem("notifiedPendingTasks");
//   //         if (hasNotified) {
//   //           return; // Don't notify again this session
//   //         }

//   //         // 3. Call your universal backend endpoint
//   //         const response = await api.get("/tasks/pending-summary");
//   //         const pendingCount = response.data?.pendingCount || 0;

//   //         if (pendingCount > 0) {
//   //           // 4. If tasks are pending, show the notification
//   //           console.log("😊✅Pending tasks found, showing notification");
//   //           showNotification(
//   //             "You Have Pending Tasks!",
//   //             `You have ${pendingCount} task(s) awaiting your attention.`
//   //           );
//   //           console.log("😊✅Pending tasks found, notification came");
//   //           // 5. Set a flag so we don't spam the user
//   //           sessionStorage.setItem("notifiedPendingTasks", "true");
//   //         }
//   //       } catch (err) {
//   //         console.error("Failed to check for pending tasks:", err);
//   //       }
//   //     };

//   //     // Run the check after a short delay to let the page load
//   //     const timer = setTimeout(checkPendingTasks, 1500);
//   //     return () => clearTimeout(timer);
//   //   }
//   // }, [token]); // This hook depends on 'token'

//   // Replacement for the notification useEffect in src/components/RequireAuth.tsx

//   useEffect(() => {
//     if (token) {
//       const runNotificationFlow = async () => {
//         // 1. Await permission status
//         const permission = await requestNotificationPermission();

//         // 2. Only proceed if permission is granted
//         if (permission !== "granted") {
//           console.log(
//             "Skipping pending task check: Notification permission not granted."
//           );
//           return;
//         }

//         // 3. Check session storage flag
//         const hasNotified = sessionStorage.getItem("notifiedPendingTasks");
//         if (hasNotified) {
//           console.log("Already notified this session. Skipping check.");
//           return; // Don't notify again this session
//         }

//         // OPTIONAL: Add a small delay for better UX after the permission dialog closes
//         await new Promise((resolve) => setTimeout(resolve, 500));

//         // 4. Check for pending tasks
//         try {
//           const response = await api.get("/tasks/pending-summary");
//           const pendingCount = response.data?.pendingCount || 0;

//           if (pendingCount > 0) {
//             console.log(
//               `😊✅Pending tasks found (${pendingCount}), showing notification.`
//             );

//             showNotification(
//               "You Have Pending Tasks!",
//               `You have ${pendingCount} task(s) awaiting your attention.`
//             );

//             setTimeout(() => {
//               sessionStorage.setItem("notifiedPendingTasks", "true");
//             }, 5000);
//           }
//         } catch (err) {
//           console.error("Failed to check for pending tasks:", err);
//         }
//       };

//       // Run the entire sequential flow
//       runNotificationFlow();
//     }
//   }, [token]); // This hook depends on 'token'

//   if (!token) return null;
//   if (requiredRoles.length > 0 && user) {
//     const userRole = user.role?.toLowerCase();
//     const hasRequiredRole = requiredRoles.some(
//       (role) =>
//         userRole === role.toLowerCase() ||
//         (userRole === "management" && role.toLowerCase() === "admin")
//     );
//     if (!hasRequiredRole) return null;
//   }

//   return <>{children}</>;
// }

// export default RequireAuth;

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
    if (token) {
      const runNotificationFlow = async () => {
        // 1. Await permission status
        const permission = await requestNotificationPermission(); // 2. Only proceed if permission is granted

        if (permission !== "granted") {
          console.log(
            "Skipping pending task check: Notification permission not granted."
          );
          return;
        } // 3. Check session storage flag

        const hasNotified = sessionStorage.getItem("notifiedPendingTasks");
        if (hasNotified) {
          console.log("Already notified this session. Skipping check.");
          return; // Don't notify again this session
        } // OPTIONAL: Add a small delay for better UX after the permission dialog closes

        await new Promise((resolve) => setTimeout(resolve, 500)); // 4. Check for pending tasks

        try {
          const response = await api.get("/tasks/pending-summary");
          const pendingCount = response.data?.pendingCount || 0;

          if (pendingCount > 0) {
            console.log(
              `😊✅Pending tasks found (${pendingCount}), showing notification.`
            );

            showNotification(
              "You Have Pending Tasks!",
              `You have ${pendingCount} task(s) awaiting your attention.`
            );

            // CRITICAL FIX: Set the flag immediately after showing the notification
            sessionStorage.setItem("notifiedPendingTasks", "true");
          }
        } catch (err) {
          console.error("Failed to check for pending tasks:", err);
        }
      }; // Run the entire sequential flow

      runNotificationFlow();
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
