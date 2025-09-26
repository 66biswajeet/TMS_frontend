'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { ChevronDown, ChevronLeft, ChevronRight, X, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSettingsContext } from '@/components/settings/use-settings-context'

// TMS Navigation Icons
const HomeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9,22 9,12 15,12 15,22" />
  </svg>
)

const CheckSquareIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <polyline points="9,11 12,14 22,4" />
    <path d="m21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
)

const FileTextIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" />
    <polyline points="14,2 14,8 20,8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10,9 9,9 8,9" />
  </svg>
)

const UsersIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="m23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="m16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const MapPinIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)

const UserCheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <polyline points="17,11 19,13 23,9" />
  </svg>
)

const BarChartIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
  </svg>
)

const BriefcaseIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
)

interface MenuItem {
  label: string
  icon: React.ReactNode
  path: string
  badge?: number
  active: boolean
  roles: string[]
  children?: MenuItem[]
}

interface MinimalccSidebarProps {
  data?: any[]
}

export function MinimalccSidebar({ data }: MinimalccSidebarProps) {
  const pathname = usePathname()
  const [userRole, setUserRole] = useState("staff")
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const settings = useSettingsContext()

  const isNavMini = settings.state.navLayout === 'mini'
  const isNavVertical = settings.state.navLayout === 'vertical' || isNavMini
  
  useEffect(() => {
    if (typeof window !== "undefined") {
      const role = localStorage.getItem("userRole") || "staff"
      setUserRole(role)
    }
  }, [])

  // Auto-close dropdown when sidebar is collapsed
  useEffect(() => {
    if (isNavMini && openDropdown) {
      setOpenDropdown(null)
    }
  }, [isNavMini, openDropdown])

  const menuItems: MenuItem[] = [
    {
      label: "Dashboard",
      icon: <HomeIcon className="h-5 w-5" />,
      path: "/",
      active: pathname === "/",
      roles: ["staff", "branch_manager", "area_manager", "auditor", "management", "admin"],
    },
    {
      label: "Tasks",
      icon: <CheckSquareIcon className="h-5 w-5" />,
      path: "/tasks",
      active: pathname.startsWith("/tasks"),
      roles: ["staff", "branch_manager", "area_manager", "auditor", "management", "admin"],
    },
    {
      label: "Templates",
      icon: <FileTextIcon className="h-5 w-5" />,
      path: "/templates",
      active: pathname.startsWith("/templates"),
      roles: ["branch_manager", "area_manager", "auditor", "management", "admin"],
    },
    {
      label: "Reviews",
      icon: <BarChartIcon className="h-5 w-5" />,
      path: "/reviews",
      active: pathname.startsWith("/reviews"),
      roles: ["branch_manager", "area_manager", "auditor", "management", "admin"],
    },
    {
      label: "Manage",
      icon: <UsersIcon className="h-5 w-5" />,
      path: "#",
      active: false,
      roles: ["management", "admin"],
      children: [
        {
          label: "Users",
          icon: <UsersIcon className="h-4 w-4" />,
          path: "/users",
          active: pathname.startsWith("/users"),
          roles: ["management", "admin"],
        },
        {
          label: "Roles",
          icon: <UserCheckIcon className="h-4 w-4" />,
          path: "/roles",
          active: pathname.startsWith("/roles"),
          roles: ["management", "admin"],
        },
        {
          label: "Branches",
          icon: <MapPinIcon className="h-4 w-4" />,
          path: "/branches",
          active: pathname.startsWith("/branches"),
          roles: ["management", "admin"],
        },
        {
          label: "Positions",
          icon: <BriefcaseIcon className="h-4 w-4" />,
          path: "/positions",
          active: pathname.startsWith("/positions"),
          roles: ["management", "admin"],
        },
      ],
    },
  ]

  const filteredMenuItems = menuItems.filter((item) => item.roles.includes(userRole))

  const toggleDropdown = (label: string) => {
    if (isNavMini) return
    setOpenDropdown(openDropdown === label ? null : label)
  }

  const hasActiveChild = (children: MenuItem[] | undefined) => {
    if (!children) return false
    return children.some((child) => child.active)
  }

  const handleToggleNav = () => {
    const newLayout = settings.state.navLayout === 'vertical' ? 'mini' : 'vertical'
    settings.setField('navLayout', newLayout)
  }

  const SidebarContent = (
    <div className="flex h-full flex-col bg-white border-r border-gray-200 dark:bg-gray-900 dark:border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center">
          {isNavMini ? (
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <span className="font-bold text-gray-900 dark:text-white">Marina TMS</span>
            </div>
          )}
        </div>
        
        {/* Mobile close button */}
        <button
          className="md:hidden inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm transition-transform duration-300"
          onClick={() => setIsMobileOpen(false)}
        >
          <X className="h-4 w-4 text-gray-600" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {filteredMenuItems.map((item) => (
          <div key={item.label}>
            {item.children ? (
              <div>
                <button
                  onClick={() => toggleDropdown(item.label)}
                  className={`
                    group relative flex items-center justify-between w-full overflow-hidden rounded-lg 
                    transition-all duration-200 ease-in-out cursor-pointer
                    ${isNavMini ? 'px-2 py-2.5' : 'px-3 py-2.5'}
                    ${item.active || hasActiveChild(item.children)
                      ? 'bg-gradient-to-r from-blue-50 to-emerald-50 text-blue-700 border-l-4 border-blue-500 shadow-sm dark:from-blue-900/50 dark:to-emerald-900/50 dark:text-blue-300'
                      : 'text-gray-700 hover:bg-gray-50 hover:shadow-sm dark:text-gray-300 dark:hover:bg-gray-800'
                    }
                  `}
                >
                  <div className={`flex items-center ${isNavMini ? 'justify-center' : 'gap-3'}`}>
                    <span className={`shrink-0 transition-all duration-200 ${item.active || hasActiveChild(item.children) ? 'text-blue-600 dark:text-blue-300' : 'text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300'} h-5 w-5`}>
                      {item.icon}
                    </span>
                    {!isNavMini && <span className="truncate font-medium text-sm">{item.label}</span>}
                  </div>
                  {!isNavMini && item.children && (
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${
                        openDropdown === item.label ? 'rotate-180' : ''
                      }`}
                    />
                  )}
                </button>

                {!isNavMini && openDropdown === item.label && (
                  <div className="ml-6 mt-1 space-y-1 border-l border-gray-200 pl-2 dark:border-gray-700">
                    {item.children
                      .filter((child) => child.roles.includes(userRole))
                      .map((child) => (
                        <Link key={child.label} href={child.path} onClick={() => setIsMobileOpen(false)}>
                          <div
                            className={`
                              flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-200 ease-in-out cursor-pointer
                              ${child.active
                                ? 'bg-blue-50 text-blue-700 font-medium dark:bg-blue-900/30 dark:text-blue-300'
                                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                              }
                            `}
                          >
                            <span className="h-4 w-4">{child.icon}</span>
                            <span className="text-sm">{child.label}</span>
                          </div>
                        </Link>
                      ))}
                  </div>
                )}
              </div>
            ) : (
              <Link href={item.path} onClick={() => setIsMobileOpen(false)}>
                <div
                  className={`
                    group relative flex items-center justify-between overflow-hidden rounded-lg 
                    transition-all duration-200 ease-in-out cursor-pointer
                    ${isNavMini ? 'px-2 py-2.5' : 'px-3 py-2.5'}
                    ${item.active
                      ? 'bg-gradient-to-r from-blue-50 to-emerald-50 text-blue-700 border-l-4 border-blue-500 shadow-sm dark:from-blue-900/50 dark:to-emerald-900/50 dark:text-blue-300'
                      : 'text-gray-700 hover:bg-gray-50 hover:shadow-sm dark:text-gray-300 dark:hover:bg-gray-800'
                    }
                  `}
                >
                  <div className={`flex items-center ${isNavMini ? 'justify-center' : 'gap-3'}`}>
                    <span className={`shrink-0 transition-all duration-200 ${item.active ? 'text-blue-600 dark:text-blue-300' : 'text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300'} h-5 w-5`}>
                      {item.icon}
                    </span>
                    {!isNavMini && <span className="truncate font-medium text-sm">{item.label}</span>}
                  </div>
                  {!isNavMini && item.badge && item.badge > 0 && (
                    <span className="rounded-full bg-blue-100 text-blue-700 px-1.5 py-0.5 text-xs font-medium min-w-[1.25rem] text-center dark:bg-blue-900/50 dark:text-blue-300">
                      {item.badge}
                    </span>
                  )}
                </div>
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* Toggle Button */}
      {isNavVertical && (
        <button
          className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-gradient-to-r from-blue-500 to-emerald-500 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 z-10"
          onClick={handleToggleNav}
        >
          {isNavMini ? (
            <ChevronRight className="h-3.5 w-3.5 text-white" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5 text-white" />
          )}
        </button>
      )}
    </div>
  )

  if (!isNavVertical) {
    return null // Handle horizontal layout separately if needed
  }

  return (
    <>
      {/* Mobile menu button */}
      {!isMobileOpen && (
        <button
          className="md:hidden fixed z-50 top-4 left-4 inline-flex items-center justify-center p-2 rounded-lg border border-gray-200 bg-white shadow-lg hover:shadow-xl transition-all duration-200"
          onClick={() => setIsMobileOpen(true)}
        >
          <Menu className="h-5 w-5 text-gray-700" />
        </button>
      )}

      {/* Desktop sidebar */}
      <aside
        className={`
          hidden md:block fixed h-screen z-40 flex-shrink-0 transition-all duration-300 ease-in-out
          ${isNavMini ? 'w-16' : 'w-64'}
        `}
      >
        {SidebarContent}
      </aside>

      {/* Mobile drawer */}
      <div className={`md:hidden fixed inset-0 z-40 ${isMobileOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div
          className={`absolute inset-0 bg-black/30 transition-opacity duration-300 ${
            isMobileOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setIsMobileOpen(false)}
        />
        <aside
          className={`absolute left-0 top-0 h-full w-64 transition-transform duration-300 ease-in-out ${
            isMobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {SidebarContent}
        </aside>
      </div>

      {/* Spacer */}
      <div className="hidden md:flex">
        <div className={`flex-shrink-0 transition-all duration-300 ease-in-out ${isNavMini ? 'w-16' : 'w-64'}`} />
      </div>
    </>
  )
}