"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Get user role from localStorage and redirect to appropriate dashboard
    const userRole = localStorage.getItem("userRole")
    const isAuthenticated = localStorage.getItem("isAuthenticated")
    
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    // Redirect based on user role
    switch (userRole) {
      case "management":
        router.push("/dashboard/management")
        break
      case "auditor":
        router.push("/dashboard/auditor")
        break
      case "area_manager":
        router.push("/dashboard/area")
        break
      case "branch_manager":
        router.push("/dashboard/branch")
        break
      case "staff":
        router.push("/dashboard/staff")
        break
      default:
        // If no valid role, redirect to login instead of defaulting
        router.push("/login")
    }
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to your dashboard...</p>
      </div>
    </div>
  )
}
