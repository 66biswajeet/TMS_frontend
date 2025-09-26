"use client"

import { PositionsManagement } from "@/components/admin/positions-management"
import RequireAuth from "@/components/RequireAuth"

export default function PositionsPage() {
  return (
    <RequireAuth requiredRoles={["management", "admin"]}>
      <PositionsManagement />
    </RequireAuth>
  )
}