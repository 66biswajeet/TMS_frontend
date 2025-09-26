import React from 'react'
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export const KPICardSkeleton: React.FC = () => (
  <Card className="transition-all duration-200">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-4 rounded" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton className="h-3 w-32 mb-2" />
      <div className="flex items-center space-x-1 mt-2">
        <Skeleton className="h-3 w-3 rounded" />
        <Skeleton className="h-4 w-8" />
        <Skeleton className="h-3 w-20" />
      </div>
    </CardContent>
  </Card>
)

export const KPIGridSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, index) => (
      <KPICardSkeleton key={index} />
    ))}
  </div>
)

export const HeatTableSkeleton: React.FC<{ rows?: number, cols?: number }> = ({ 
  rows = 5, 
  cols = 6 
}) => (
  <Card>
    <CardHeader>
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                {Array.from({ length: cols }).map((_, index) => (
                  <th key={index} className="px-4 py-3 text-left">
                    <Skeleton className="h-4 w-20" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rows }).map((_, rowIndex) => (
                <tr key={rowIndex} className="border-b">
                  {Array.from({ length: cols }).map((_, colIndex) => (
                    <td key={colIndex} className="px-4 py-3">
                      <Skeleton className="h-4 w-16" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </CardContent>
  </Card>
)

export const ChartSkeleton: React.FC<{ height?: number }> = ({ height = 300 }) => (
  <Card>
    <CardHeader>
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="w-full space-y-4">
          {/* Chart bars simulation */}
          <div className="flex items-end justify-between space-x-2">
            {Array.from({ length: 7 }).map((_, index) => (
              <Skeleton 
                key={index} 
                className="w-12" 
                style={{ 
                  height: Math.random() * (height * 0.6) + (height * 0.1) 
                }} 
              />
            ))}
          </div>
          {/* X-axis labels */}
          <div className="flex justify-between">
            {Array.from({ length: 7 }).map((_, index) => (
              <Skeleton key={index} className="h-3 w-8" />
            ))}
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
)

export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6 p-6">
    {/* Header Skeleton */}
    <div className="flex items-center justify-between">
      <div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-5 w-96 mt-2" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>

    {/* KPI Grid Skeleton */}
    <KPIGridSkeleton />

    {/* Tab Navigation Skeleton */}
    <div className="space-y-6">
      <div className="flex space-x-1 rounded bg-muted p-1">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-9 w-24 rounded-sm" />
        ))}
      </div>

      {/* Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton />
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-6 w-48" />
            </div>
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="p-3 rounded border">
                    <Skeleton className="h-6 w-8 mx-auto mb-2" />
                    <Skeleton className="h-3 w-16 mx-auto" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Large Table Skeleton */}
      <HeatTableSkeleton rows={8} cols={8} />
    </div>
  </div>
)

// Branch drill-down skeleton
export const BranchDetailsSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Branch KPIs */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <KPICardSkeleton key={index} />
      ))}
    </div>

    {/* Staff Performance */}
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-6 w-32" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between p-2 rounded border">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16 rounded" />
              </div>
              <div className="text-right">
                <Skeleton className="h-4 w-12 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>

    {/* Template Issues */}
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-6 w-32" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between p-2 rounded border">
              <Skeleton className="h-4 w-32" />
              <div className="text-right">
                <Skeleton className="h-4 w-12 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
)