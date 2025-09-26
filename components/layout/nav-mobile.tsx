"use client"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { useEffect, useState } from "react"

import { Iconify } from "../iconify/iconify"

// ----------------------------------------------------------------------

type NavItem = {
  title: string
  path: string
  icon: string
  roles?: string[]
}

type NavGroup = {
  subheader: string
  items: NavItem[]
}

type NavMobileProps = {
  data: NavGroup[]
  open: boolean
  onClose: () => void
}

export function NavMobile({ data, open, onClose }: NavMobileProps) {
  const pathname = usePathname()
  const [currentUser, setCurrentUser] = useState<{name?: string, role?: string}>({});
  const [userRole, setUserRole] = useState<string>("staff");

  useEffect(() => {
    // Get current user from localStorage on client side only
    if (typeof window !== "undefined") {
      const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
      setCurrentUser(user);
      setUserRole(user?.role || "staff");
    }
  }, []);

  const renderNavItem = (item: NavItem) => {
    // Check if user has permission to see this item
    if (item.roles && !item.roles.includes(userRole)) {
      return null
    }

    const isActive = pathname === item.path

    return (
      <li key={item.title} className="mb-1">
        <Link
          href={item.path}
          onClick={onClose}
          className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
            isActive
              ? "bg-primary/10 text-primary border-l-4 border-primary"
              : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          }`}
        >
          <div className="flex items-center justify-center w-6 h-6 mr-3">
            <Iconify icon={item.icon} width={20} />
          </div>
          <span className={`text-sm ${isActive ? "font-semibold" : "font-medium"}`}>{item.title}</span>
        </Link>
      </li>
    )
  }

  const renderNavGroup = (group: NavGroup) => (
    <div key={group.subheader} className="mb-6">
      <h3 className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">{group.subheader}</h3>
      <ul className="space-y-1">{group.items.map(renderNavItem)}</ul>
    </div>
  )

  return (
    <>
      {/* Backdrop */}
      {open && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}

      {/* Drawer */}
      <div
        className={`fixed left-0 top-0 h-full w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-50 transform transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        } lg:hidden`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-4 py-6 border-b border-gray-200 dark:border-gray-700">
            <img src="/marina-pharmacy-logo.webp" alt="Marina Pharmacy" className="h-8 w-auto" />
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-4">{data.map(renderNavGroup)}</div>

          {/* User Info */}
          <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500">
              {currentUser?.name} • {userRole}
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
