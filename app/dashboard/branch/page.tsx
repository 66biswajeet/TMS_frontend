"use client";
import { BranchDashboard } from "@/components/dashboard/branch-dashboard";
import RequireAuth from "@/components/RequireAuth";
import ClientOnlyWrapper from "@/components/dashboard/client-only-wrapper";

export default function BranchDashboardPage() {
  return (
    <RequireAuth requiredRoles={["branch_manager"]}>
      <ClientOnlyWrapper fallback={
        <div className="flex justify-center items-center h-64">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mr-2"></div>
          <p>Loading branch manager dashboard...</p>
        </div>
      }>
        <BranchDashboard />
      </ClientOnlyWrapper>
    </RequireAuth>
  );
}
