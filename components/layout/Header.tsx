"use client";

import React from "react";
import { Menu, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  MinimalccAccountButton,
  MinimalccAccountDrawer,
} from "./minimalcc-account-drawer";
import { NotificationDropdown } from "./notification-dropdown";
import { useNotifications } from "@/lib/notifications-context";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const [accountDrawerOpen, setAccountDrawerOpen] = React.useState(false);
  const [settingsDrawerOpen, setSettingsDrawerOpen] = React.useState(false);

  const {
    notifications,
    removeNotification,
    clearAllNotifications,
    markAsRead,
  } = useNotifications();

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
            {/* Notification Dropdown */}
            <NotificationDropdown
              notifications={notifications}
              onRemove={removeNotification}
              onClearAll={clearAllNotifications}
              onMarkAsRead={markAsRead}
            />

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
            <MinimalccAccountButton
              onClick={() => setAccountDrawerOpen(true)}
            />
          </div>
        </div>
      </header>

      {/* Account Drawer */}
      <MinimalccAccountDrawer
        open={accountDrawerOpen}
        onClose={() => setAccountDrawerOpen(false)}
      />
    </>
  );
}
