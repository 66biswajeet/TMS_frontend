"use client"

import React from "react"
import { usePathname } from "next/navigation"
import { AppShell } from "@/components/layout/AppShell"

interface ConditionalLayoutProps {
  children: React.ReactNode
}

const authRoutes = ['/login', '/register', '/reset-password', '/verify', '/unauthorized']

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()
  
  // Check if current route should not have AppShell (like login, auth pages)
  const shouldShowAppShell = !authRoutes.some(route => pathname.startsWith(route))
  
  if (shouldShowAppShell) {
    return <AppShell>{children}</AppShell>
  }
  
  return <>{children}</>
}