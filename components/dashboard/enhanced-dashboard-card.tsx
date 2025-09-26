import type { ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DashboardCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: "primary" | "success" | "warning" | "error" | "info"
}

export function EnhancedDashboardCard({ title, value, subtitle, icon, trend, color = "primary" }: DashboardCardProps) {
  const colorClasses = {
    primary: "text-primary bg-primary/10 border-primary/20",
    success: "text-success bg-success/10 border-success/20",
    warning: "text-warning bg-warning/10 border-warning/20",
    error: "text-destructive bg-destructive/10 border-destructive/20",
    info: "text-info bg-info/10 border-info/20",
  }

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-slide-up">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon && (
              <div
                className={`p-3 rounded-xl border ${colorClasses[color]} group-hover:scale-110 transition-transform duration-200`}
              >
                {icon}
              </div>
            )}
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="text-3xl font-bold text-foreground tracking-tight">{value}</div>

          {subtitle && <p className="text-sm text-muted-foreground leading-relaxed">{subtitle}</p>}

          {trend && (
            <div className="flex items-center gap-2 pt-2">
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  trend.isPositive
                    ? "bg-success/10 text-success border border-success/20"
                    : "bg-destructive/10 text-destructive border border-destructive/20"
                }`}
              >
                <span className="text-sm">{trend.isPositive ? "↗" : "↘"}</span>
                {Math.abs(trend.value)}%
              </div>
              <span className="text-xs text-muted-foreground">vs last month</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
