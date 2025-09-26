"use client";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { RootState } from "@/redux/store";

interface RequireAuthProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export function RequireAuth({ children, requiredRoles = [] }: RequireAuthProps) {
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
      const hasRequiredRole = requiredRoles.some(role =>
        userRole === role.toLowerCase() ||
        (userRole === 'management' && role.toLowerCase() === 'admin')
      );
      
      if (!hasRequiredRole) {
        router.replace("/unauthorized");
        return;
      }
    }
  }, [token, user, requiredRoles, router]);

  if (!token) return null;
  if (requiredRoles.length > 0 && user) {
    const userRole = user.role?.toLowerCase();
    const hasRequiredRole = requiredRoles.some(role =>
      userRole === role.toLowerCase() ||
      (userRole === 'management' && role.toLowerCase() === 'admin')
    );
    if (!hasRequiredRole) return null;
  }

  return <>{children}</>;
}

export default RequireAuth;
