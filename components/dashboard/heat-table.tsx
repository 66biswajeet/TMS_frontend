"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Download, Eye } from "lucide-react"

interface HeatCellProps {
  value: number
  max: number
  min: number
  format?: 'number' | 'percentage'
  className?: string
}

const HeatCell: React.FC<HeatCellProps> = ({ value, max, min, format = 'number', className }) => {
  const range = max - min
  const normalizedValue = range > 0 ? (value - min) / range : 0.5
  
  // Generate color intensity based on normalized value (green = good, red = bad)
  const getHeatColor = (intensity: number) => {
    if (intensity >= 0.8) return 'bg-green-500 text-white'
    if (intensity >= 0.6) return 'bg-green-300 text-green-900'
    if (intensity >= 0.4) return 'bg-yellow-200 text-yellow-900'
    if (intensity >= 0.2) return 'bg-orange-300 text-orange-900'
    return 'bg-red-400 text-white'
  }

  const formatValue = (val: number) => {
    switch (format) {
      case 'percentage':
        return `${val}%`
      default:
        return val.toLocaleString()
    }
  }

  return (
    <div className={cn(
      'px-2 py-1 rounded text-center text-sm font-medium transition-all duration-200',
      getHeatColor(normalizedValue),
      className
    )}>
      {formatValue(value)}
    </div>
  )
}

interface Column {
  key: string
  label: string
  type?: 'text' | 'number' | 'percentage' | 'badge' | 'heat'
  sortable?: boolean
  width?: string
}

interface HeatTableProps {
  title: string
  description?: string
  data: any[]
  columns: Column[]
  onRowClick?: (row: any) => void
  searchable?: boolean
  exportable?: boolean
  className?: string
}

export const HeatTable: React.FC<HeatTableProps> = ({
  title,
  description,
  data,
  columns,
  onRowClick,
  searchable = true,
  exportable = true,
  className
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortColumn, setSortColumn] = useState<string>('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Filter data based on search term
  const filteredData = data.filter(row =>
    searchable ? Object.values(row).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    ) : true
  )

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortColumn) return 0
    
    const aVal = a[sortColumn]
    const bVal = b[sortColumn]
    
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
    }
    
    const aStr = String(aVal).toLowerCase()
    const bStr = String(bVal).toLowerCase()
    
    if (sortDirection === 'asc') {
      return aStr.localeCompare(bStr)
    }
    return bStr.localeCompare(aStr)
  })

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(columnKey)
      setSortDirection('desc')
    }
  }

  const getColumnStats = (columnKey: string) => {
    const values = data.map(row => row[columnKey]).filter(val => typeof val === 'number')
    return {
      min: Math.min(...values),
      max: Math.max(...values)
    }
  }

  const renderCell = (row: any, column: Column) => {
    const value = row[column.key]
    
    switch (column.type) {
      case 'heat':
        const stats = getColumnStats(column.key)
        return (
          <HeatCell 
            value={value} 
            max={stats.max} 
            min={stats.min} 
            format={column.key.includes('Rate') || column.key.includes('Percent') ? 'percentage' : 'number'}
          />
        )
      
      case 'percentage':
        return <span className="font-medium">{value}%</span>
      
      case 'badge':
        const getBadgeVariant = (val: number) => {
          if (val >= 90) return 'default'
          if (val >= 75) return 'secondary' 
          if (val >= 60) return 'outline'
          return 'destructive'
        }
        return <Badge variant={getBadgeVariant(value)}>{value}</Badge>
      
      case 'number':
        return <span className="font-mono">{value.toLocaleString()}</span>
      
      default:
        return <span>{value}</span>
    }
  }

  const exportToCSV = () => {
    const headers = columns.map(col => col.label).join(',')
    const rows = sortedData.map(row => 
      columns.map(col => `"${row[col.key]}"`).join(',')
    ).join('\n')
    
    const csv = `${headers}\n${rows}`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="flex items-center space-x-2">
            {searchable && (
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-48"
                />
              </div>
            )}
            {exportable && (
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                disabled={data.length === 0}
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className={cn(
                        "px-4 py-3 text-left text-sm font-medium",
                        column.width && `w-${column.width}`,
                        column.sortable && "cursor-pointer hover:bg-muted/80 transition-colors"
                      )}
                      onClick={column.sortable ? () => handleSort(column.key) : undefined}
                    >
                      <div className="flex items-center space-x-1">
                        <span>{column.label}</span>
                        {column.sortable && (
                          <div className="flex flex-col">
                            {sortColumn === column.key ? (
                              sortDirection === 'asc' ? (
                                <ArrowUp className="h-3 w-3" />
                              ) : (
                                <ArrowDown className="h-3 w-3" />
                              )
                            ) : (
                              <ArrowUpDown className="h-3 w-3 opacity-50" />
                            )}
                          </div>
                        )}
                      </div>
                    </th>
                  ))}
                  {onRowClick && (
                    <th className="px-4 py-3 text-left text-sm font-medium w-16">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {sortedData.map((row, index) => (
                  <tr
                    key={index}
                    className={cn(
                      "border-b transition-colors",
                      onRowClick && "hover:bg-muted/50 cursor-pointer"
                    )}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {columns.map((column) => (
                      <td key={column.key} className="px-4 py-3">
                        {renderCell(row, column)}
                      </td>
                    ))}
                    {onRowClick && (
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            onRowClick(row)
                          }}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            
            {sortedData.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No data available</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
          <span>
            Showing {sortedData.length} of {data.length} entries
            {searchTerm && ` (filtered from ${data.length})`}
          </span>
          
          {/* Color legend */}
          <div className="flex items-center space-x-4">
            <span className="text-xs">Performance:</span>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-xs">Excellent</span>
              <div className="w-3 h-3 bg-yellow-200 rounded"></div>
              <span className="text-xs">Average</span>
              <div className="w-3 h-3 bg-red-400 rounded"></div>
              <span className="text-xs">Poor</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}