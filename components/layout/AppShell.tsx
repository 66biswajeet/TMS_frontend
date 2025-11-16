// "use client";

// import React from "react";
// import { useSelector } from "react-redux";
// import { Header } from "./Header";
// import { Sidebar } from "./sidebar";
// import { cn } from "@/lib/utils";
// import type { RootState } from "@/redux/store";

// interface AppShellProps {
//   children: React.ReactNode;
//   className?: string;
// }

// export function AppShell({ children, className }: AppShellProps) {
//   const [sidebarOpen, setSidebarOpen] = React.useState(false);
//   const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
//   const [userRole, setUserRole] = React.useState("staff");
//   const [notificationCount, setNotificationCount] = React.useState(0);
//   const [isClient, setIsClient] = React.useState(false);

//   // Get auth state from Redux
//   const auth = useSelector((state: RootState) => state.auth);

//   React.useEffect(() => {
//     setIsClient(true);
//   }, []);

//   React.useEffect(() => {
//     if (!isClient) return;

//     // Get user role from localStorage or Redux
//     const role = auth.user?.role || localStorage.getItem("userRole") || "staff";
//     setUserRole(role);
//   }, [isClient, auth.user]);

//   const handleSidebarToggle = () => {
//     setSidebarOpen(!sidebarOpen);
//   };

//   const handleSidebarClose = () => {
//     setSidebarOpen(false);
//   };

//   const handleSidebarCollapse = () => {
//     setSidebarCollapsed(!sidebarCollapsed);
//   };

//   // Handle responsive behavior
//   React.useEffect(() => {
//     const handleResize = () => {
//       // Auto-close mobile sidebar on desktop
//       if (window.innerWidth >= 1024) {
//         setSidebarOpen(false);
//       }
//     };

//     window.addEventListener("resize", handleResize);
//     return () => window.removeEventListener("resize", handleResize);
//   }, []);

//   return (
//     <div
//       className={cn(
//         "min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200",
//         className
//       )}
//     >
//       {/* Sidebar */}
//       <Sidebar
//         isOpen={sidebarOpen}
//         isCollapsed={sidebarCollapsed}
//         onClose={handleSidebarClose}
//         onToggleCollapse={handleSidebarCollapse}
//         userRole={userRole}
//       />

//       {/* Main Content Area */}
//       <div
//         className={cn(
//           "transition-all duration-300 ease-in-out",
//           // Desktop margins based on sidebar state
//           "lg:ml-16", // Default collapsed margin
//           !sidebarCollapsed && "lg:ml-64" // Expanded margin
//         )}
//       >
//         {/* Header */}
//         <Header
//           onMenuClick={handleSidebarToggle}
//           notificationCount={notificationCount}
//         />

//         {/* Page Content */}
//         <main className="p-4 md:p-6 min-h-[calc(100vh-4rem)]">
//           <div className="max-w-full mx-auto">{children}</div>
//         </main>
//       </div>
//     </div>
//   );
// }

"use client";

import React from "react";
import { useSelector } from "react-redux";
import { Header } from "./Header";
import { Sidebar } from "./sidebar";
import { cn } from "@/lib/utils";
import type { RootState } from "@/redux/store";
import RealtimeProvider from "@/components/realtime/RealtimeProvider";

interface AppShellProps {
  children: React.ReactNode;
  className?: string;
}

export function AppShell({ children, className }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [isClient, setIsClient] = React.useState(false);

  // Get auth state from Redux
  const auth = useSelector((state: RootState) => state.auth);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  console.log("❤️USER OBJECT FOR NAV:", auth.user);

  /* <-- 2. REMOVED useEffect block that set userRole --> */

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  const handleSidebarCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Handle responsive behavior
  React.useEffect(() => {
    const handleResize = () => {
      // Auto-close mobile sidebar on desktop
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      className={cn(
        "min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200",
        className
      )}
    >
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onClose={handleSidebarClose}
        onToggleCollapse={handleSidebarCollapse}
        // <-- 3. MODIFIED this line -->
        user={auth.user || { role: "staff" }}
      />

      {/* Main Content Area */}
      <div
        className={cn(
          "transition-all duration-300 ease-in-out",
          // Desktop margins based on sidebar state
          "lg:ml-16", // Default collapsed margin
          !sidebarCollapsed && "lg:ml-64" // Expanded margin
        )}
      >
        {/* Header */}
        <Header onMenuClick={handleSidebarToggle} />

        {/* Realtime & socket initialization (mounts only inside AppShell when user is authenticated/layout is shown) */}
        <RealtimeProvider />

        {/* Page Content */}
        <main className="p-4 md:p-6 min-h-[calc(100vh-4rem)]">
          <div className="max-w-full mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
