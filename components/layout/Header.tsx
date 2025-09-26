"use client"

import React from "react"
import { Menu, Bell, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MinimalccAccountButton, MinimalccAccountDrawer } from "./minimalcc-account-drawer"

interface HeaderProps {
  onMenuClick: () => void
  notificationCount?: number
}

export function Header({ onMenuClick, notificationCount = 0 }: HeaderProps) {
  const [accountDrawerOpen, setAccountDrawerOpen] = React.useState(false)
  const [settingsDrawerOpen, setSettingsDrawerOpen] = React.useState(false)

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-gray-900/95 dark:supports-[backdrop-filter]:bg-gray-900/60 dark:border-gray-800">
        <div className="flex h-16 items-center px-4 gap-4">
          {/* Mobile menu button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden" 
            onClick={onMenuClick}
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Left area - can be used for breadcrumbs or title */}
          <div className="flex-1 flex items-center text-sm text-gray-600 dark:text-gray-400">
            <span className="hidden sm:inline">Task Management System</span>
            <span className="sm:hidden">TMS</span>
          </div>

          {/* Right side icons */}
          <div className="flex items-center gap-2">
            {/* Notification Button */}
            <Button
              variant="ghost"
              size="icon"
              className="relative h-10 w-10 hover:bg-blue-100 dark:hover:bg-blue-900/50"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <Badge
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                  variant="destructive"
                >
                  {notificationCount}
                </Badge>
              )}
            </Button>

            {/* Settings Button */}
            <Button
              variant="ghost"
              size="icon"
              className="relative h-10 w-10 hover:bg-blue-100 dark:hover:bg-blue-900/50"
              onClick={() => setSettingsDrawerOpen(true)}
              aria-label="Settings"
            >
              <Settings className="h-5 w-5" />
            </Button>

            {/* Account Button */}
            <MinimalccAccountButton onClick={() => setAccountDrawerOpen(true)} />
          </div>
        </div>
      </header>

      {/* Account Drawer */}
      <MinimalccAccountDrawer
        open={accountDrawerOpen}
        onClose={() => setAccountDrawerOpen(false)}
      />
    </>
  )
}