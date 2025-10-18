"use client";

import { useState, useEffect } from "react";
import { User, Home, Settings, LogOut, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface AccountMenuItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  info?: string;
}

interface MinimalccAccountDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function MinimalccAccountDrawer({
  open,
  onClose,
}: MinimalccAccountDrawerProps) {
  const [user, setUser] = useState<{
    name: string;
    email: string;
    role: string;
  } | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Load user data from localStorage or API
    const userData = {
      name: localStorage.getItem("userName") || "John Doe",
      email: localStorage.getItem("userEmail") || "john.doe@marina.com",
      role: localStorage.getItem("userRole") || "staff",
    };
    setUser(userData);
  }, []);

  const accountMenuItems: AccountMenuItem[] = [
    {
      label: "Profile",
      href: "/profile",
      icon: <User className="h-5 w-5" />,
    },
    {
      label: "Dashboard",
      href: "/",
      icon: <Home className="h-5 w-5" />,
    },
    {
      label: "Account Settings",
      href: "/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  const handleSignOut = () => {
    // Clear user data from localStorage
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRole");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("notifiedPendingTasks");

    onClose();
    router.push("/login");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleDisplayName = (role: string) => {
    const roleMap: Record<string, string> = {
      admin: "Administrator",
      management: "Management",
      area_manager: "Area Manager",
      branch_manager: "Branch Manager",
      auditor: "Auditor",
      staff: "Staff Member",
    };
    return roleMap[role] || role;
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-80 p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="p-4 pb-2">
            <SheetTitle className="text-lg font-semibold text-left">
              Account
            </SheetTitle>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="px-4 pb-4">
              {/* User Profile Section */}
              <div className="flex flex-col items-center text-center py-6">
                {/* Animated Avatar Border */}
                <div className="relative mb-4">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 animate-pulse opacity-75 blur-sm"></div>
                  <div className="relative p-1 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500">
                    <Avatar className="h-20 w-20 border-2 border-white">
                      <AvatarImage
                        src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}`}
                      />
                      <AvatarFallback className="text-lg font-semibold bg-gray-100">
                        {user ? getInitials(user.name) : "JD"}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                    {user?.name || "John Doe"}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {user?.email || "john.doe@marina.com"}
                  </p>
                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {user ? getRoleDisplayName(user.role) : "Staff Member"}
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              {/* Menu Items */}
              <nav className="space-y-1">
                {accountMenuItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    {item.info && (
                      <span className="ml-auto px-2 py-1 text-xs bg-red-100 text-red-600 rounded-full">
                        {item.info}
                      </span>
                    )}
                  </Link>
                ))}
              </nav>
            </div>
          </ScrollArea>

          {/* Sign Out Button */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-all dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950/30 dark:hover:text-red-300 dark:hover:border-red-700"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Account Button Component
interface MinimalccAccountButtonProps {
  onClick: () => void;
}

export function MinimalccAccountButton({
  onClick,
}: MinimalccAccountButtonProps) {
  const [user, setUser] = useState<{ name: string; email: string } | null>(
    null
  );

  useEffect(() => {
    const userData = {
      name: localStorage.getItem("userName") || "John Doe",
      email: localStorage.getItem("userEmail") || "john.doe@marina.com",
    };
    setUser(userData);
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className="h-10 px-2 gap-2 hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      <Avatar className="h-8 w-8">
        <AvatarImage
          src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}`}
        />
        <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-blue-500 to-emerald-500 text-white">
          {user ? getInitials(user.name) : "JD"}
        </AvatarFallback>
      </Avatar>
      <div className="hidden sm:flex flex-col items-start text-left">
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {user?.name || "John Doe"}
        </span>
        <span className="text-xs text-gray-600 dark:text-gray-400 max-w-[120px] truncate">
          {user?.email || "john.doe@marina.com"}
        </span>
      </div>
    </Button>
  );
}
