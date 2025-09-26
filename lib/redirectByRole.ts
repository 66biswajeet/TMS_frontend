export function dashboardPathForRole(roleName: string, rank: number): string {
  switch (roleName) {
    case "management":      return "/dashboard/management";
    case "auditor":         return "/dashboard/auditor";
    case "area_manager":    return "/dashboard/area";
    case "branch_manager":  return "/dashboard/branch";
    case "staff":           return "/dashboard/staff";
    default:                return "/";
  }
}
