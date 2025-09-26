"use client"

import dynamic from 'next/dynamic'
import React from 'react'

interface ClientOnlyWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

const ClientOnlyWrapper: React.FC<ClientOnlyWrapperProps> = ({ 
  children, 
  fallback = (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-2"></div>
      <span>Loading dashboard...</span>
    </div>
  )
}) => {
  const [hasMounted, setHasMounted] = React.useState(false)

  React.useEffect(() => {
    setHasMounted(true)
  }, [])

  if (!hasMounted) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

export default ClientOnlyWrapper