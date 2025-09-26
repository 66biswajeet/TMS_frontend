"use client";
import { AreaDashboard } from "@/components/dashboard/area-dashboard";
import RequireAuth from "@/components/RequireAuth";
import ClientOnlyWrapper from "@/components/dashboard/client-only-wrapper";

export default function AreaDashboardPage() {
  return (
    <RequireAuth requiredRoles={["area_manager"]}>
      <ClientOnlyWrapper>
        <AreaDashboard />
      </ClientOnlyWrapper>
    </RequireAuth>
  );
}
