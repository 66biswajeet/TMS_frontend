"use client";

import RequireAuth from "@/components/RequireAuth";
import { PasswordResetRequests } from "@/components/admin/password-reset-requests";

// Add this tab or section to your management dashboard

export default function PositionsPage() {
  return (
    <RequireAuth requiredRoles={["management", "admin"]}>
      <PasswordResetRequests />;
    </RequireAuth>
  );
}
