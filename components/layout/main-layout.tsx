"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { SettingsProvider, defaultSettings, SettingsDrawer } from "@/components/settings"

// Import dark theme styles
import "../../styles/dark-theme.css"

// Import your original layout components
import { Sidebar } from "./sidebar"
import { Topbar } from "./topbar"

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const [userRole, setUserRole] = useState("staff")
  const [userName, setUserName] = useState("John Doe")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const router = useRouter()

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return
    
    // Check authentication
    const isAuthenticated = localStorage.getItem("isAuthenticated")
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    // Get user data
    const role = localStorage.getItem("userRole") || "staff"
    const name = localStorage.getItem("userName") || "John Doe"
    setUserRole(role)
    setUserName(name)
  }, [router, isClient])

  return (
    <SettingsProvider defaultSettings={defaultSettings}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        {/* Sidebar */}
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        
        {/* Main Content */}
        <div className={`transition-all duration-300 ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-52'}`}>
          {/* Topbar */}
          <Topbar
            onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            userName={userName}
          />
          
          {/* Page Content */}
          <main className="p-4 md:p-6 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            <div className="max-w-full">
              {children}
            </div>
          </main>
        </div>

        {/* Settings Drawer */}
        <SettingsDrawer defaultSettings={defaultSettings} />
      </div>
    </SettingsProvider>
  )
}
