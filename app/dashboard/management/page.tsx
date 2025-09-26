"use client";
import { ManagementDashboard } from "@/components/dashboard/management-dashboard";
import RequireAuth from "@/components/RequireAuth";
import ClientOnlyWrapper from "@/components/dashboard/client-only-wrapper";

export default function ManagementDashboardPage() {
  return (
    <RequireAuth requiredRoles={["management"]}>
      <ClientOnlyWrapper fallback={
        <div className="flex justify-center items-center h-64">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mr-2"></div>
          <p>Loading management dashboard...</p>
        </div>
      }>
        <ManagementDashboard />
      </ClientOnlyWrapper>
    </RequireAuth>
  );
}
