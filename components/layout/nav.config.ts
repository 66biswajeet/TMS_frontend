import { HomeIcon, CheckSquareIcon, FileTextIcon, UsersIcon, MapPinIcon, UserCheckIcon, BarChartIcon, BriefcaseIcon } from "lucide-react"

type AppUser = {
  role: string;
  position?: string; // Use the name of the position property on your user object
};

export interface NavItem {
  label: string
  href: string
  icon: any
  badge?: number
  roles: string[]
  children?: NavItem[]
  specialAccess?: (user: AppUser) => boolean;
}

export const navigationConfig: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard/management",
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
    label: "My Attendance",
    href: "/attendance",
    icon: BarChartIcon,
    roles: ["staff","branch_manager", "area_manager", "auditor", "management", "admin"],
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
      {
        label: "Manage Attendance",
        href: "/manageAttendance",
        icon: BarChartIcon,
        roles: ["management", "admin"],
        specialAccess: (user) =>
          user.role === 'staff' && user.position?.toLowerCase() === 'hr',
      
      },
      {
        label: "Manage Queries",
        href: "/manageQuery",
        icon: BarChartIcon,
        roles: ["management", "admin"],
        specialAccess: (user) =>
          user.role === 'staff' && user.position?.toLowerCase() === 'hr',
      },
      {
        label: "Manage Expected Timings",
        href: "/manageExpectedTimings",
        icon: BarChartIcon,
        roles: ["management", "admin"],
        specialAccess: (user) =>
          user.role === 'staff' && user.position?.toLowerCase() === 'hr',
      },
    ],
  },
]

// export const getUserNavigationItems = (userRole: string): NavItem[] => {
//   return navigationConfig
//     .filter(item => item.roles.includes(userRole))
//     .map(item => ({
//       ...item,
//       children: item.children?.filter(child => child.roles.includes(userRole))
//     }))
// }


export const getUserNavigationItems = (user: AppUser): NavItem[] => {
  return navigationConfig
    .map(item => {
      // First, filter the children (if any)
      const visibleChildren = item.children?.filter(child =>
        // Check 1: Does the user have the role?
        child.roles.includes(user.role) ||
        // Check 2: Does the user pass the special access check?
        (child.specialAccess && child.specialAccess(user))
      );

      // Return the item with its children filtered
      return {
        ...item,
        children: visibleChildren
      };
    })
    .filter(item => {
      // Now, filter the top-level items
      
      // Check 1: Does the user have the role for the parent?
      if (item.roles.includes(user.role)) return true;

      // Check 2: Does the user pass the special access check for the parent?
      if (item.specialAccess && item.specialAccess(user)) return true;

      // Check 3: Is this a parent item (like "Manage") that has visible children?
      if (item.children && item.children.length > 0) return true;

      // If none of the above, hide the item
      return false;
    });
};