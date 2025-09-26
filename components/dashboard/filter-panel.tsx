"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
  Filter,
  X,
  Calendar as CalendarIcon,
  Building,
  Users,
  FileText,
  Clock,
  RefreshCw,
  Download
} from "lucide-react"
import { format } from "date-fns"
import { DateRange } from "react-day-picker"

interface FilterOption {
  value: string
  label: string
  count?: number
}

interface FilterState {
  dateRange: DateRange | undefined
  period: string
  branches: string[]
  channels: string[]
  positions: string[]
  templates: string[]
  roles: string[]
  status: string[]
}

interface FilterPanelProps {
  onFiltersChange: (filters: FilterState) => void
  branches?: FilterOption[]
  channels?: FilterOption[]
  positions?: FilterOption[]
  templates?: FilterOption[]
  roles?: FilterOption[]
  statusOptions?: FilterOption[]
  isLoading?: boolean
  className?: string
  showExport?: boolean
  onExport?: (filters: FilterState) => void
  onRefresh?: () => void
}

const PERIOD_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' },
]

const DEFAULT_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'partial', label: 'Partial' },
]

export const FilterPanel: React.FC<FilterPanelProps> = ({
  onFiltersChange,
  branches = [],
  channels = [],
  positions = [],
  templates = [],
  roles = [],
  statusOptions = DEFAULT_STATUS_OPTIONS,
  isLoading = false,
  className,
  showExport = true,
  onExport,
  onRefresh
}) => {
  const [filters, setFilters] = useState<FilterState>({
    dateRange: undefined,
    period: 'month',
    branches: [],
    channels: [],
    positions: [],
    templates: [],
    roles: [],
    status: []
  })

  const [isExpanded, setIsExpanded] = useState(false)
  const [searchTerms, setSearchTerms] = useState({
    branch: '',
    channel: '',
    position: '',
    template: '',
    role: ''
  })

  useEffect(() => {
    onFiltersChange(filters)
  }, [filters, onFiltersChange])

  const updateFilters = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const addFilter = (category: keyof FilterState, value: string) => {
    if (Array.isArray(filters[category])) {
      const currentValues = filters[category] as string[]
      if (!currentValues.includes(value)) {
        updateFilters(category, [...currentValues, value])
      }
    }
  }

  const removeFilter = (category: keyof FilterState, value: string) => {
    if (Array.isArray(filters[category])) {
      const currentValues = filters[category] as string[]
      updateFilters(category, currentValues.filter(v => v !== value))
    }
  }

  const clearAllFilters = () => {
    setFilters({
      dateRange: undefined,
      period: 'month',
      branches: [],
      channels: [],
      positions: [],
      templates: [],
      roles: [],
      status: []
    })
    setSearchTerms({
      branch: '',
      channel: '',
      position: '',
      template: '',
      role: ''
    })
  }

  const getActiveFilterCount = () => {
    return (
      filters.branches.length +
      filters.channels.length +
      filters.positions.length +
      filters.templates.length +
      filters.roles.length +
      filters.status.length +
      (filters.dateRange?.from ? 1 : 0)
    )
  }

  const filterOptions = (options: FilterOption[], searchTerm: string) => {
    return options.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const renderMultiSelect = (
    title: string,
    icon: React.ReactNode,
    options: FilterOption[],
    selectedValues: string[],
    category: keyof FilterState,
    searchKey: keyof typeof searchTerms
  ) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium flex items-center gap-2">
        {icon}
        {title}
        {selectedValues.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            {selectedValues.length}
          </Badge>
        )}
      </Label>
      
      <Input
        placeholder={`Search ${title.toLowerCase()}...`}
        value={searchTerms[searchKey]}
        onChange={(e) => setSearchTerms(prev => ({ ...prev, [searchKey]: e.target.value }))}
        className="text-sm"
      />
      
      <div className="max-h-32 overflow-y-auto space-y-1">
        {filterOptions(options, searchTerms[searchKey]).map(option => (
          <div
            key={option.value}
            className={cn(
              "flex items-center justify-between p-2 rounded text-sm cursor-pointer transition-colors",
              selectedValues.includes(option.value)
                ? "bg-primary/10 text-primary"
                : "hover:bg-muted"
            )}
            onClick={() => {
              if (selectedValues.includes(option.value)) {
                removeFilter(category, option.value)
              } else {
                addFilter(category, option.value)
              }
            }}
          >
            <span>{option.label}</span>
            {option.count !== undefined && (
              <Badge variant="outline" className="text-xs">
                {option.count}
              </Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <CardTitle className="text-lg">Filters</CardTitle>
            {getActiveFilterCount() > 0 && (
              <Badge variant="secondary">
                {getActiveFilterCount()} active
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              </Button>
            )}
            {showExport && onExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExport(filters)}
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
          </div>
        </div>
        
        {getActiveFilterCount() > 0 && (
          <CardDescription>
            <div className="flex items-center justify-between">
              <span>Active filters applied</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            </div>
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Period Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Time Period
          </Label>
          <Select
            value={filters.period}
            onValueChange={(value) => updateFilters('period', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Custom Date Range */}
        {filters.period === 'custom' && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Date Range</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateRange?.from ? (
                    filters.dateRange.to ? (
                      <>
                        {format(filters.dateRange.from, "LLL dd, y")} -{" "}
                        {format(filters.dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(filters.dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={filters.dateRange?.from}
                  selected={filters.dateRange}
                  onSelect={(range) => updateFilters('dateRange', range)}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        )}

        {/* Status Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Status
            {filters.status.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {filters.status.length}
              </Badge>
            )}
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {statusOptions.map(option => (
              <Button
                key={option.value}
                variant={filters.status.includes(option.value) ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  if (filters.status.includes(option.value)) {
                    removeFilter('status', option.value)
                  } else {
                    addFilter('status', option.value)
                  }
                }}
                className="justify-start text-xs"
              >
                {option.label}
                {option.count !== undefined && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {option.count}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </div>

        {isExpanded && (
          <>
            <Separator />
            
            {/* Advanced Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {branches.length > 0 && renderMultiSelect(
                'Branches',
                <Building className="h-4 w-4" />,
                branches,
                filters.branches,
                'branches',
                'branch'
              )}

              {channels.length > 0 && renderMultiSelect(
                'Channels',
                <Building className="h-4 w-4" />,
                channels,
                filters.channels,
                'channels',
                'channel'
              )}

              {positions.length > 0 && renderMultiSelect(
                'Positions',
                <Users className="h-4 w-4" />,
                positions,
                filters.positions,
                'positions',
                'position'
              )}

              {templates.length > 0 && renderMultiSelect(
                'Templates',
                <FileText className="h-4 w-4" />,
                templates,
                filters.templates,
                'templates',
                'template'
              )}

              {roles.length > 0 && renderMultiSelect(
                'Roles',
                <Users className="h-4 w-4" />,
                roles,
                filters.roles,
                'roles',
                'role'
              )}
            </div>
          </>
        )}

        {/* Active Filters Display */}
        {getActiveFilterCount() > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <Label className="text-sm font-medium">Active Filters:</Label>
              <div className="flex flex-wrap gap-2">
                {filters.branches.map(branch => (
                  <Badge key={branch} variant="secondary" className="text-xs">
                    Branch: {branches.find(b => b.value === branch)?.label}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1"
                      onClick={() => removeFilter('branches', branch)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
                {filters.channels.map(channel => (
                  <Badge key={channel} variant="secondary" className="text-xs">
                    Channel: {channels.find(c => c.value === channel)?.label}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1"
                      onClick={() => removeFilter('channels', channel)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
                {filters.status.map(status => (
                  <Badge key={status} variant="secondary" className="text-xs">
                    Status: {statusOptions.find(s => s.value === status)?.label}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1"
                      onClick={() => removeFilter('status', status)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}