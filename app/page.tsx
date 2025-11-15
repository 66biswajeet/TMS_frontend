// "use client";

// import { useEffect } from "react";
// import { useRouter } from "next/navigation";

// export default function HomePage() {
//   const router = useRouter();

//   useEffect(() => {
//     // Get user role from localStorage and redirect to appropriate dashboard
//     const token =
//       typeof window !== "undefined" ? localStorage.getItem("token") : null;
//     const userRole = localStorage.getItem("userRole");
//     const isAuthenticated = localStorage.getItem("isAuthenticated");

//     if (!token || !isAuthenticated) {
//       router.push("/login");
//       return;
//     }

//     // Redirect based on user role
//     switch (userRole) {
//       case "management":
//         router.push("/dashboard/management");
//         break;
//       case "auditor":
//         router.push("/dashboard/auditor");
//         break;
//       case "area_manager":
//         router.push("/dashboard/area");
//         break;
//       case "branch_manager":
//         router.push("/dashboard/branch");
//         break;
//       case "staff":
//         router.push("/dashboard/staff");
//         break;
//       default:
//         // If no valid role, redirect to login instead of defaulting
//         router.push("/login");
//     }
//   }, [router]);

//   return (
//     <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//       <div className="text-center">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
//         <p className="text-gray-600">Redirecting to your dashboard...</p>
//       </div>
//     </div>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

interface RequireAuthProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export default function RequireAuth({
  children,
  requiredRoles = [],
}: RequireAuthProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        const userRole = localStorage.getItem("userRole");

        if (!token) {
          router.push("/login");
          return;
        }

        // Verify token with backend
        const response = await axios.get(
          "http://localhost:5000/api/auth/verify-token",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Check if user has required role
        if (
          requiredRoles.length > 0 &&
          !requiredRoles.includes(userRole || "")
        ) {
          router.push("/unauthorized");
          return;
        }

        if (response.status === 200) {
          setIsAuthorized(true);
        }
      } catch (error) {
        console.error("Auth verification failed:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("userRole");
        localStorage.removeItem("isAuthenticated");
        router.push("/login");
      }
    };

    verifyAuth();
  }, [router, requiredRoles]);

  if (isAuthorized === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
