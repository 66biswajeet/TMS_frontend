"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus, LucideIcon } from "lucide-react"

interface KPICardProps {
  title: string
  value: string | number
  description?: string
  trend?: {
    value: number
    isPositive: boolean
    period: string
  }
  icon?: LucideIcon
  variant?: 'default' | 'success' | 'warning' | 'destructive'
  format?: 'number' | 'percentage' | 'duration' | 'currency'
  className?: string
}

const formatValue = (value: string | number, format?: string): string => {
  if (typeof value === 'string') return value
  
  switch (format) {
    case 'percentage':
      return `${value}%`
    case 'duration':
      return `${value}h`
    case 'currency':
      return `$${value.toLocaleString()}`
    case 'number':
    default:
      return value.toLocaleString()
  }
}

const getVariantStyles = (variant?: string) => {
  switch (variant) {
    case 'success':
      return 'border-green-200 bg-green-50 dark:bg-green-950'
    case 'warning':
      return 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950'
    case 'destructive':
      return 'border-red-200 bg-red-50 dark:bg-red-950'
    default:
      return 'border-border bg-card'
  }
}

const getIconColor = (variant?: string) => {
  switch (variant) {
    case 'success':
      return 'text-green-600 dark:text-green-400'
    case 'warning':
      return 'text-yellow-600 dark:text-yellow-400'
    case 'destructive':
      return 'text-red-600 dark:text-red-400'
    default:
      return 'text-primary'
  }
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  description,
  trend,
  icon: Icon,
  variant = 'default',
  format = 'number',
  className
}) => {
  const TrendIcon = trend?.isPositive ? TrendingUp : TrendingDown
  const trendColor = trend?.isPositive ? 'text-green-600' : 'text-red-600'

  return (
    <Card className={cn(
      'transition-all duration-200 hover:shadow-md hover:-translate-y-1',
      getVariantStyles(variant),
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <Icon className={cn('h-4 w-4', getIconColor(variant))} />
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">
          {formatValue(value, format)}
        </div>
        {description && (
          <CardDescription className="text-xs mt-1">
            {description}
          </CardDescription>
        )}
        {trend && (
          <div className="flex items-center space-x-1 mt-2">
            <TrendIcon className={cn('h-3 w-3', trendColor)} />
            <Badge 
              variant={trend.isPositive ? 'secondary' : 'destructive'} 
              className="text-xs px-1.5 py-0.5"
            >
              {trend.isPositive ? '+' : ''}{trend.value}%
            </Badge>
            <span className="text-xs text-muted-foreground ml-2">
              vs {trend.period}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface KPIGridProps {
  kpis: Array<KPICardProps>
  className?: string
}

export const KPIGrid: React.FC<KPIGridProps> = ({ kpis, className }) => {
  return (
    <div className={cn(
      'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4',
      className
    )}>
      {kpis.map((kpi, index) => (
        <KPICard key={index} {...kpi} />
      ))}
    </div>
  )
}