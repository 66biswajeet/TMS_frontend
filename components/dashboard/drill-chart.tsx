"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { Download, TrendingUp, BarChart3, PieChart as PieChartIcon, Activity } from "lucide-react"

interface ChartDataPoint {
  [key: string]: any
}

interface DrillChartProps {
  title: string
  description?: string
  data: ChartDataPoint[]
  type: 'line' | 'area' | 'bar' | 'pie' | 'stacked-bar'
  xAxisKey?: string
  yAxisKeys?: string[]
  colors?: string[]
  height?: number
  showLegend?: boolean
  showGrid?: boolean
  onDataPointClick?: (data: any) => void
  isLoading?: boolean
  className?: string
  periodSelector?: boolean
  onPeriodChange?: (period: string) => void
  exportable?: boolean
}

const DEFAULT_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green  
  '#f59e0b', // yellow
  '#ef4444', // red
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
]

const PERIOD_OPTIONS = [
  { value: '7days', label: 'Last 7 Days' },
  { value: '30days', label: 'Last 30 Days' },
  { value: '3months', label: 'Last 3 Months' },
  { value: '6months', label: 'Last 6 Months' },
  { value: '1year', label: 'Last Year' },
]

export const DrillChart: React.FC<DrillChartProps> = ({
  title,
  description,
  data,
  type,
  xAxisKey = 'name',
  yAxisKeys = ['value'],
  colors = DEFAULT_COLORS,
  height = 300,
  showLegend = true,
  showGrid = true,
  onDataPointClick,
  isLoading = false,
  className,
  periodSelector = false,
  onPeriodChange,
  exportable = false
}) => {
  const [chartType, setChartType] = React.useState(type)

  const exportChart = () => {
    // Simple CSV export
    const headers = [xAxisKey, ...yAxisKeys].join(',')
    const rows = data.map(row => 
      [xAxisKey, ...yAxisKeys].map(key => `"${row[key] || ''}"`).join(',')
    ).join('\n')
    
    const csv = `${headers}\n${rows}`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.replace(/\s+/g, '-').toLowerCase()}-chart-data.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-sm mb-2">{`${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p
              key={index}
              className="text-sm"
              style={{ color: entry.color }}
            >
              {`${entry.name}: ${entry.value?.toLocaleString()}`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const renderChart = () => {
    const chartProps = {
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
      onClick: onDataPointClick,
    }

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...chartProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
            <XAxis 
              dataKey={xAxisKey} 
              className="text-xs fill-muted-foreground"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              className="text-xs fill-muted-foreground"
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            {yAxisKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        )

      case 'area':
        return (
          <AreaChart {...chartProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
            <XAxis 
              dataKey={xAxisKey} 
              className="text-xs fill-muted-foreground"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              className="text-xs fill-muted-foreground"
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            {yAxisKeys.map((key, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stackId="1"
                stroke={colors[index % colors.length]}
                fill={colors[index % colors.length]}
                fillOpacity={0.6}
              />
            ))}
          </AreaChart>
        )

      case 'bar':
      case 'stacked-bar':
        return (
          <BarChart {...chartProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
            <XAxis 
              dataKey={xAxisKey} 
              className="text-xs fill-muted-foreground"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              className="text-xs fill-muted-foreground"
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            {yAxisKeys.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                stackId={chartType === 'stacked-bar' ? '1' : undefined}
                fill={colors[index % colors.length]}
                radius={[2, 2, 0, 0]}
              />
            ))}
          </BarChart>
        )

      case 'pie':
        return (
          <PieChart {...chartProps}>
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey={yAxisKeys[0]}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
          </PieChart>
        )

      default:
        return <div>Unsupported chart type</div>
    }
  }

  const ChartTypeIcon = () => {
    switch (chartType) {
      case 'line':
      case 'area':
        return <Activity className="h-4 w-4" />
      case 'bar':
      case 'stacked-bar':
        return <BarChart3 className="h-4 w-4" />
      case 'pie':
        return <PieChartIcon className="h-4 w-4" />
      default:
        return <TrendingUp className="h-4 w-4" />
    }
  }

  if (isLoading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ChartTypeIcon />
            {title}
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center" style={{ height }}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <ChartTypeIcon />
              {title}
            </CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          
          <div className="flex items-center gap-2">
            {periodSelector && onPeriodChange && (
              <Select onValueChange={onPeriodChange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            {type !== 'pie' && (
              <Select value={chartType} onValueChange={(value) => setChartType(value as any)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">Line</SelectItem>
                  <SelectItem value="area">Area</SelectItem>
                  <SelectItem value="bar">Bar</SelectItem>
                  <SelectItem value="stacked-bar">Stacked</SelectItem>
                </SelectContent>
              </Select>
            )}
            
            {exportable && (
              <Button
                variant="outline"
                size="sm"
                onClick={exportChart}
                disabled={!data.length}
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center" style={{ height }}>
            <p className="text-muted-foreground">No data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            {renderChart()}
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}