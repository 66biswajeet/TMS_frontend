"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useBoolean } from "../../hooks/use-boolean"

import { NavMobile } from "./nav-mobile"
import { Sidebar } from "./sidebar"
import { Searchbar } from "./searchbar"
import { HeaderSection } from "./header-section"
import { AccountDrawer } from "./account-drawer"
import { SettingsButton } from "./settings-button"

// ----------------------------------------------------------------------

export type DashboardLayoutProps = {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Get current user from localStorage
  const currentUser = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("currentUser") || "{}") : {}

  const { value: open, onFalse: onClose, onTrue: onOpen } = useBoolean()

  useEffect(() => {
    setIsMounted(true)

    // Check for saved dark mode preference
    const savedDarkMode = localStorage.getItem("darkMode") === "true"
    setIsDarkMode(savedDarkMode)

    // Apply dark mode to document
    if (savedDarkMode) {
      document.documentElement.classList.add("dark")
      document.body.style.backgroundColor = "oklch(0.09 0 0)"
      document.body.style.color = "oklch(0.98 0 0)"
    } else {
      document.documentElement.classList.remove("dark")
      document.body.style.backgroundColor = "#ffffff"
      document.body.style.color = "oklch(0.15 0 0)"
    }

    // Listen for dark mode changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "darkMode") {
        const newDarkMode = e.newValue === "true"
        setIsDarkMode(newDarkMode)

        if (newDarkMode) {
          document.documentElement.classList.add("dark")
          document.body.style.backgroundColor = "oklch(0.09 0 0)"
          document.body.style.color = "oklch(0.98 0 0)"
        } else {
          document.documentElement.classList.remove("dark")
          document.body.style.backgroundColor = "#ffffff"
          document.body.style.color = "oklch(0.15 0 0)"
        }
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  const navData = [
    {
      subheader: "Marina Pharmacy TMS",
      items: [
        {
          title: "Dashboard",
          path: "/",
          icon: "solar:home-2-bold-duotone",
        },
        {
          title: "Tasks",
          path: "/tasks",
          icon: "solar:checklist-minimalistic-bold-duotone",
        },
        {
          title: "Reviews",
          path: "/reviews",
          icon: "solar:clipboard-check-bold-duotone",
          roles: ["branch_manager", "area_manager", "auditor", "management", "admin"],
        },
        {
          title: "Templates",
          path: "/templates",
          icon: "solar:document-text-bold-duotone",
        },
      ],
    },
    {
      subheader: "Administration",
      items: [
        {
          title: "Users",
          path: "/users",
          icon: "solar:users-group-two-rounded-bold-duotone",
          roles: ["management", "admin"],
        },
        {
          title: "Roles",
          path: "/roles",
          icon: "solar:shield-user-bold-duotone",
          roles: ["management", "admin"],
        },
        {
          title: "Branches",
          path: "/branches",
          icon: "solar:buildings-2-bold-duotone",
          roles: ["management", "admin"],
        },
        {
          title: "Areas",
          path: "/areas",
          icon: "solar:map-point-bold-duotone",
          roles: ["management", "admin"],
        },
      ],
    },
  ]

  const renderHeader = () => {
    const headerSlots = {
      leftArea: (
        <div className="flex items-center">
          <img src="/marina-pharmacy-logo.webp" alt="Marina Pharmacy" className="h-8 w-auto" />
        </div>
      ),
      rightArea: (
        <div className="flex items-center gap-2">
          <Searchbar />
          <SettingsButton />
          <AccountDrawer data={currentUser} />
        </div>
      ),
    }

    return (
      <HeaderSection
        className={`px-4 sm:px-6 md:px-8 ${
          isMounted && isDarkMode ? "bg-slate-800 text-slate-100 border-slate-700" : "bg-white text-slate-900 border-slate-200"
        }`}
        slots={headerSlots}
      />
    )
  }

  const renderMain = () => (
    <main
      className={`px-4 sm:px-6 md:px-8 py-4 sm:py-6 min-h-[calc(100vh-4rem)] mt-16 transition-all duration-300 ${
        sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
      } ${isMounted && isDarkMode ? "bg-slate-900 text-slate-100" : "bg-slate-50 text-slate-900"}`}
    >
      {children}
    </main>
  )

  return (
    <div className={`min-h-screen flex flex-col font-sans ${isMounted && isDarkMode ? "dark bg-slate-900" : "bg-slate-50"}`}>
      <Sidebar
        data={navData}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {renderHeader()}
      {renderMain()}

      <NavMobile data={navData} open={open} onClose={onClose} />
    </div>
  )
}
