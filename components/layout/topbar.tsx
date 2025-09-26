"use client"

import { useState } from "react"
import { HiOutlineBell, HiOutlineCog6Tooth } from "react-icons/hi2"
import { HiBars3 } from "react-icons/hi2"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useSettingsContext } from "@/components/settings/use-settings-context"
import { MinimalccAccountButton, MinimalccAccountDrawer } from "./minimalcc-account-drawer"

interface TopbarProps {
  onMenuClick: () => void
  userName?: string
}

export function Topbar({ onMenuClick, userName = "John Doe" }: TopbarProps) {
  const [notificationCount, setNotificationCount] = useState(3)
  const [accountDrawerOpen, setAccountDrawerOpen] = useState(false)
  const settings = useSettingsContext()

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-gray-900/95 dark:supports-[backdrop-filter]:bg-gray-900/60 dark:border-gray-800">
        <div className="flex h-16 items-center px-4 gap-4">
          {/* Mobile menu button */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
            <HiBars3 className="h-5 w-5" />
          </Button>

          {/* Left area - can be used for breadcrumbs or title */}
          <div className="flex-1 flex items-center text-sm text-gray-600 dark:text-gray-400">
            <span>Task Management System</span>
          </div>

          {/* Right side icons */}
          <div className="flex items-center gap-2">
            {/* Alarm/Notification Button (replacing search bar) */}
            <Button
              variant="ghost"
              size="icon"
              className="relative h-10 w-10 hover:bg-blue-100 dark:hover:bg-blue-900/50"
            >
              <HiOutlineBell className="h-5 w-5" />
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
              onClick={settings.onToggleDrawer}
            >
              <HiOutlineCog6Tooth className="h-5 w-5" />
              {settings.canReset && (
                <Badge
                  className="absolute -top-1 -right-1 h-2 w-2 rounded-full p-0"
                  variant="destructive"
                />
              )}
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
