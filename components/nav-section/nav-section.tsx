"use client"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { useState } from "react"
import { Iconify } from "../iconify/iconify"

export type NavSectionProps = {
  data: Array<{
    subheader?: string
    items: Array<{
      title: string
      path?: string
      icon: string
      roles?: string[]
      children?: Array<{
        title: string
        path: string
        roles?: string[]
      }>
    }>
  }>
  isNavMini?: boolean
}

export function NavSection({ data, isNavMini = false }: NavSectionProps) {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})

  // Get current user role from localStorage
  const currentUser = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("currentUser") || "{}") : {}
  const userRole = currentUser.role || "staff"

  const toggleExpanded = (itemTitle: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemTitle]: !prev[itemTitle],
    }))
  }

  const renderSubItem = (subItem: any, parentTitle: string) => {
    if (subItem.roles && !subItem.roles.includes(userRole)) {
      return null
    }

    const isActive = pathname === subItem.path

    return (
      <li key={`${parentTitle}-${subItem.title}`}>
        <Link
          href={subItem.path}
          className={`flex items-center py-2 pl-12 pr-4 text-sm rounded-lg transition-colors ${
            isActive
              ? "text-primary bg-primary/10 font-semibold"
              : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          }`}
        >
          {subItem.title}
        </Link>
      </li>
    )
  }

  const renderNavItem = (item: any) => {
    // Check if user has permission to see this item
    if (item.roles && !item.roles.includes(userRole)) {
      return null
    }

    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems[item.title] || false
    const isActive = item.path ? pathname === item.path : false

    const navItem = (
      <li key={item.title}>
        <button
          onClick={hasChildren ? () => toggleExpanded(item.title) : undefined}
          className={`w-full flex items-center py-3 px-4 text-sm rounded-lg transition-colors ${
            isActive
              ? "text-primary bg-primary/10 font-semibold"
              : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          } ${isNavMini ? "justify-center" : "justify-start"}`}
        >
          <div className={`flex items-center justify-center w-5 h-5 ${isNavMini ? "" : "mr-3"}`}>
            <Iconify icon={item.icon} width={20} />
          </div>

          {!isNavMini && (
            <>
              <span className="flex-1 text-left">{item.title}</span>
              {hasChildren && (
                <Iconify
                  icon={isExpanded ? "eva:chevron-down-fill" : "eva:chevron-right-fill"}
                  width={16}
                  className="ml-2 text-gray-400"
                />
              )}
            </>
          )}
        </button>

        {/* Render children if expanded */}
        {hasChildren && !isNavMini && isExpanded && (
          <ul className="mt-1 space-y-1">{item.children.map((subItem: any) => renderSubItem(subItem, item.title))}</ul>
        )}
      </li>
    )

    if (isNavMini) {
      return (
        <div key={item.title} className="relative group">
          {navItem}
          {/* Tooltip for mini nav */}
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            {item.title}
          </div>
        </div>
      )
    }

    return navItem
  }

  const renderNavGroup = (group: any) => (
    <div key={group.subheader} className="mb-6">
      {group.subheader && !isNavMini && (
        <h3 className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">{group.subheader}</h3>
      )}

      <ul className={`space-y-1 ${isNavMini ? "px-2" : "px-4"}`}>{group.items.map(renderNavItem)}</ul>
    </div>
  )

  return <div>{data.map(renderNavGroup)}</div>
}
