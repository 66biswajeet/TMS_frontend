"use client"

import React from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronLeft, ChevronRight, ChevronDown, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { navigationConfig, getUserNavigationItems, type NavItem } from "./nav.config"
import { cn } from "@/lib/utils"

interface SidebarProps {
  isOpen: boolean
  isCollapsed: boolean
  onClose: () => void
  onToggleCollapse: () => void
  userRole: string
  className?: string
}

interface SidebarItemProps {
  item: NavItem
  isCollapsed: boolean
  onItemClick: () => void
  openDropdowns: Set<string>
  onToggleDropdown: (label: string) => void
}

function SidebarItem({ item, isCollapsed, onItemClick, openDropdowns, onToggleDropdown }: SidebarItemProps) {
  const pathname = usePathname()
  const isActive = item.href !== "#" && (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href))
  const hasChildren = item.children && item.children.length > 0
  const isDropdownOpen = openDropdowns.has(item.label)
  const hasActiveChild = hasChildren && item.children!.some(child => 
    child.href !== "#" && (child.href === "/" ? pathname === "/" : pathname.startsWith(child.href))
  )

  const handleClick = () => {
    if (hasChildren && !isCollapsed) {
      onToggleDropdown(item.label)
    } else if (item.href !== "#") {
      onItemClick()
    }
  }

  const Icon = item.icon

  return (
    <div>
      {hasChildren ? (
        <div
          className={cn(
            "group relative flex items-center justify-between overflow-hidden rounded-lg transition-all duration-200 ease-in-out cursor-pointer",
            isCollapsed ? "px-2 py-2.5" : "px-3 py-2.5",
            (isActive || hasActiveChild)
              ? "bg-gradient-to-r from-blue-50 to-emerald-50 text-blue-700 border-l-4 border-blue-500 shadow-sm"
              : "text-slate-700 hover:bg-slate-50 hover:shadow-sm"
          )}
          onClick={handleClick}
        >
          <div className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-3")}>
            <Icon
              className={cn(
                "h-5 w-5 shrink-0 transition-all duration-200",
                (isActive || hasActiveChild) ? "text-blue-600" : "text-slate-500 group-hover:text-slate-700"
              )}
            />
            {!isCollapsed && <span className="truncate font-medium text-sm">{item.label}</span>}
          </div>
          {!isCollapsed && hasChildren && (
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                isDropdownOpen ? "rotate-180" : ""
              )}
            />
          )}
        </div>
      ) : (
        <Link href={item.href} onClick={onItemClick}>
          <div
            className={cn(
              "group relative flex items-center justify-between overflow-hidden rounded-lg transition-all duration-200 ease-in-out cursor-pointer",
              isCollapsed ? "px-2 py-2.5" : "px-3 py-2.5",
              isActive
                ? "bg-gradient-to-r from-blue-50 to-emerald-50 text-blue-700 border-l-4 border-blue-500 shadow-sm"
                : "text-slate-700 hover:bg-slate-50 hover:shadow-sm"
            )}
          >
            <div className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-3")}>
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0 transition-all duration-200",
                  isActive ? "text-blue-600" : "text-slate-500 group-hover:text-slate-700"
                )}
              />
              {!isCollapsed && <span className="truncate font-medium text-sm">{item.label}</span>}
            </div>
            {!isCollapsed && item.badge && item.badge > 0 && (
              <Badge
                className="rounded-full bg-blue-100 text-blue-700 px-1.5 py-0.5 text-xs font-medium min-w-[1.25rem] text-center"
              >
                {item.badge}
              </Badge>
            )}
          </div>
        </Link>
      )}

      {/* Dropdown children */}
      {hasChildren && !isCollapsed && isDropdownOpen && (
        <div className="ml-6 mt-1 space-y-1 border-l border-slate-200 pl-2">
          {item.children!.map((child) => {
            const childIsActive = child.href !== "#" && (child.href === "/" ? pathname === "/" : pathname.startsWith(child.href))
            const ChildIcon = child.icon

            return (
              <Link key={child.label} href={child.href} onClick={onItemClick}>
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-200 ease-in-out cursor-pointer",
                    childIsActive
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <ChildIcon className="h-4 w-4" />
                  <span className="text-sm">{child.label}</span>
                  {child.badge && child.badge > 0 && (
                    <Badge
                      className="ml-auto rounded-full bg-blue-100 text-blue-700 px-1.5 py-0.5 text-xs font-medium"
                    >
                      {child.badge}
                    </Badge>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function Sidebar({ isOpen, isCollapsed, onClose, onToggleCollapse, userRole, className }: SidebarProps) {
  const [openDropdowns, setOpenDropdowns] = React.useState<Set<string>>(new Set())
  const [isClient, setIsClient] = React.useState(false)

  React.useEffect(() => {
    setIsClient(true)
  }, [])

  React.useEffect(() => {
    // Auto-close dropdowns when sidebar is collapsed
    if (isCollapsed) {
      setOpenDropdowns(new Set())
    }
  }, [isCollapsed])

  React.useEffect(() => {
    // Prevent body scroll when mobile sidebar is open
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  const handleToggleDropdown = (label: string) => {
    const newOpenDropdowns = new Set(openDropdowns)
    if (newOpenDropdowns.has(label)) {
      newOpenDropdowns.delete(label)
    } else {
      newOpenDropdowns.add(label)
    }
    setOpenDropdowns(newOpenDropdowns)
  }

  const handleItemClick = () => {
    // Close mobile sidebar on item click
    onClose()
  }

  const filteredMenuItems = isClient ? getUserNavigationItems(userRole) : []

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200/70">
        <div className="flex items-center">
          {isCollapsed ? (
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
          ) : (
            /* Show logo only on desktop (>= 900px) */
            <div className="hidden lg:block">
              <Image
                src="/marina-pharmacy-logo.webp"
                alt="Marina Pharmacy"
                width={150}
                height={40}
                className="object-contain"
                priority
              />
            </div>
          )}
        </div>
        
        {/* Close button for mobile */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onClose}
          aria-label="Close menu"
        >
          <X className="h-4 w-4 text-slate-600" />
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1.5">
          {!isClient ? (
            /* Loading skeleton */
            <div className="animate-pulse space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 bg-slate-200 rounded-lg" />
              ))}
            </div>
          ) : (
            filteredMenuItems.map((item) => (
              <SidebarItem
                key={item.label}
                item={item}
                isCollapsed={isCollapsed}
                onItemClick={handleItemClick}
                openDropdowns={openDropdowns}
                onToggleDropdown={handleToggleDropdown}
              />
            ))
          )}
        </nav>
      </ScrollArea>

      {/* Desktop collapse toggle button */}
      <Button
        variant="ghost"
        size="icon"
        className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-gradient-to-r from-blue-500 to-emerald-500 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 z-10"
        onClick={onToggleCollapse}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <ChevronRight className="h-3.5 w-3.5 text-white" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5 text-white" />
        )}
      </Button>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:block fixed left-0 top-0 h-screen z-40 border-r border-slate-200 bg-white transition-all duration-300 ease-in-out",
          isCollapsed ? "w-16" : "w-64",
          className
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 z-40 transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/30"
          onClick={onClose}
        />
        
        {/* Mobile drawer */}
        <aside
          className={cn(
            "absolute left-0 top-0 h-full w-64 border-r border-slate-200 bg-white transition-transform duration-300 ease-in-out",
            isOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {sidebarContent}
        </aside>
      </div>
    </>
  )
}