"use client";

import React, { useState, useEffect } from "react";
import { Bell, X, Trash2, CheckCircle, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface Notification {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  scheduledTime?: Date; // Optional: for missed notifications showing when they were supposed to arrive
}

interface NotificationDropdownProps {
  notifications: Notification[];
  onClearAll: () => void;
  onRemove: (id: string) => void;
  onMarkAsRead: (id: string) => void;
}

const NotificationIcon = ({ type }: { type: Notification["type"] }) => {
  switch (type) {
    case "success":
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    case "error":
      return <AlertCircle className="h-5 w-5 text-red-600" />;
    case "warning":
      return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    case "info":
    default:
      return <Info className="h-5 w-5 text-blue-600" />;
  }
};

const formatTime = (date: Date) => {
  try {
    const now = new Date();
    const timestamp = date instanceof Date ? date : new Date(date);
    const diffInSeconds = Math.floor(
      (now.getTime() - timestamp.getTime()) / 1000
    );

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return timestamp.toLocaleDateString();
  } catch (error) {
    console.error("Error formatting time:", error);
    return "Unknown time";
  }
};

const formatScheduledTime = (date: Date) => {
  try {
    const timestamp = date instanceof Date ? date : new Date(date);
    const hours = timestamp.getHours();
    const minutes = timestamp.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, "0");
    const month = timestamp.getMonth() + 1;
    const day = timestamp.getDate();

    return `${month}/${day} ${displayHours}:${displayMinutes} ${ampm}`;
  } catch (error) {
    console.error("Error formatting scheduled time:", error);
    return "Unknown time";
  }
};

export function NotificationDropdown({
  notifications,
  onClearAll,
  onRemove,
  onMarkAsRead,
}: NotificationDropdownProps) {
  const [open, setOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = (id: string) => {
    onMarkAsRead(id);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 hover:bg-blue-100 dark:hover:bg-blue-900/50"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
              variant="destructive"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[380px] p-0" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="h-5 px-2 text-xs">
                {unreadCount} new
              </Badge>
            )}
          </div>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="h-7 px-2 text-xs hover:bg-red-100 hover:text-red-700"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear All
            </Button>
          )}
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">No notifications</p>
            <p className="text-xs text-gray-400 mt-1">You're all caught up!</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`relative group px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer ${
                    !notification.read ? "bg-blue-50 dark:bg-blue-950" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification.id)}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <NotificationIcon type={notification.type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {notification.title}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemove(notification.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                          aria-label="Remove notification"
                        >
                          <X className="h-3 w-3 text-gray-500" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {formatTime(notification.timestamp)}
                        </p>
                        {notification.scheduledTime && (
                          <>
                            <span className="text-xs text-gray-400">•</span>
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                              Scheduled:{" "}
                              {formatScheduledTime(notification.scheduledTime)}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {!notification.read && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-600 rounded-full" />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
