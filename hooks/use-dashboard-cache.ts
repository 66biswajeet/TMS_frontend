import { useState, useEffect, useCallback } from 'react'

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresIn: number
}

interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  staleWhileRevalidate?: boolean
}

class DashboardCache {
  private cache = new Map<string, CacheEntry<any>>()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const ttl = options.ttl || this.DEFAULT_TTL
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn: ttl
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const isExpired = Date.now() - entry.timestamp > entry.expiresIn
    if (isExpired) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  isStale(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return true

    const isExpired = Date.now() - entry.timestamp > entry.expiresIn
    return isExpired
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear()
      return
    }

    const regex = new RegExp(pattern)
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  size(): number {
    return this.cache.size
  }
}

// Global cache instance
const dashboardCache = new DashboardCache()

export function useDashboardCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions & { enabled?: boolean } = {}
) {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isStale, setIsStale] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const { enabled = true, staleWhileRevalidate = true } = options

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!enabled) return

    // Check cache first
    const cachedData = dashboardCache.get<T>(key)
    const cacheIsStale = dashboardCache.isStale(key)

    if (cachedData && !forceRefresh) {
      setData(cachedData)
      setIsStale(cacheIsStale)
      
      // If stale but staleWhileRevalidate is enabled, fetch in background
      if (cacheIsStale && staleWhileRevalidate) {
        try {
          const freshData = await fetcher()
          dashboardCache.set(key, freshData, options)
          setData(freshData)
          setIsStale(false)
        } catch (err) {
          // Keep stale data on background fetch error
          console.warn('Background refresh failed:', err)
        }
      }
      return
    }

    // No cached data or force refresh
    setIsLoading(true)
    setError(null)

    try {
      const freshData = await fetcher()
      dashboardCache.set(key, freshData, options)
      setData(freshData)
      setIsStale(false)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Fetch failed')
      setError(error)
      
      // Fallback to stale cache on error
      if (cachedData && staleWhileRevalidate) {
        setData(cachedData)
        setIsStale(true)
      }
    } finally {
      setIsLoading(false)
    }
  }, [key, fetcher, enabled, staleWhileRevalidate, options])

  const invalidateCache = useCallback((pattern?: string) => {
    dashboardCache.invalidate(pattern)
  }, [])

  const refresh = useCallback(() => {
    return fetchData(true)
  }, [fetchData])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    isLoading,
    isStale,
    error,
    refresh,
    invalidateCache,
    cacheSize: dashboardCache.size()
  }
}

// Hook for dashboard-specific caching with optimized keys
export function useDashboardData<T>(
  endpoint: string,
  filters: Record<string, any> = {},
  options: CacheOptions = {}
) {
  // Create a stable cache key from endpoint and filters
  const cacheKey = `dashboard:${endpoint}:${JSON.stringify(filters)}`
  
  const fetcher = useCallback(async (): Promise<T> => {
    const queryParams = new URLSearchParams(filters).toString()
    const url = queryParams ? `${endpoint}?${queryParams}` : endpoint
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch ${endpoint}: ${response.statusText}`)
    }
    
    return response.json()
  }, [endpoint, filters])

  return useDashboardCache(cacheKey, fetcher, {
    ttl: 3 * 60 * 1000, // 3 minutes for dashboard data
    staleWhileRevalidate: true,
    ...options
  })
}