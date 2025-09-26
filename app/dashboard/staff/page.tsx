"use client";
import { StaffDashboard } from "@/components/dashboard/staff-dashboard";
import RequireAuth from "@/components/RequireAuth";
import ClientOnlyWrapper from "@/components/dashboard/client-only-wrapper";

export default function StaffDashboardPage() {
  return (
    <RequireAuth requiredRoles={["staff"]}>
      <ClientOnlyWrapper>
        <StaffDashboard />
      </ClientOnlyWrapper>
    </RequireAuth>
  );
}
