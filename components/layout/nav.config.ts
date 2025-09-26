import { HomeIcon, CheckSquareIcon, FileTextIcon, UsersIcon, MapPinIcon, UserCheckIcon, BarChartIcon, BriefcaseIcon } from "lucide-react"

export interface NavItem {
  label: string
  href: string
  icon: any
  badge?: number
  roles: string[]
  children?: NavItem[]
}

export const navigationConfig: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: HomeIcon,
    roles: ["staff", "branch_manager", "area_manager", "auditor", "management", "admin"],
  },
  {
    label: "Tasks",
    href: "/tasks",
    icon: CheckSquareIcon,
    roles: ["staff", "branch_manager", "area_manager", "auditor", "management", "admin"],
  },
  {
    label: "Templates",
    href: "/templates",
    icon: FileTextIcon,
    roles: ["branch_manager", "area_manager", "auditor", "management", "admin"],
  },
  {
    label: "Reviews",
    href: "/reviews",
    icon: BarChartIcon,
    roles: ["branch_manager", "area_manager", "auditor", "management", "admin"],
  },
  {
    label: "Manage",
    href: "#",
    icon: UsersIcon,
    roles: ["management", "admin"],
    children: [
      {
        label: "Users",
        href: "/users",
        icon: UsersIcon,
        roles: ["management", "admin"],
      },
      {
        label: "Roles",
        href: "/roles",
        icon: UserCheckIcon,
        roles: ["management", "admin"],
      },
      {
        label: "Branches",
        href: "/branches",
        icon: MapPinIcon,
        roles: ["management", "admin"],
      },
      {
        label: "Positions",
        href: "/positions",
        icon: BriefcaseIcon,
        roles: ["management", "admin"],
      },
    ],
  },
]

export const getUserNavigationItems = (userRole: string): NavItem[] => {
  return navigationConfig
    .filter(item => item.roles.includes(userRole))
    .map(item => ({
      ...item,
      children: item.children?.filter(child => child.roles.includes(userRole))
    }))
}