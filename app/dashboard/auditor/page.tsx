"use client";
import { AuditorDashboard } from "@/components/dashboard/auditor-dashboard";
import RequireAuth from "@/components/RequireAuth";
import ClientOnlyWrapper from "@/components/dashboard/client-only-wrapper";

export default function AuditorDashboardPage() {
  return (
    <RequireAuth requiredRoles={["auditor"]}>
      <ClientOnlyWrapper>
        <AuditorDashboard />
      </ClientOnlyWrapper>
    </RequireAuth>
  );
}
