'use client'

import { useState } from 'react'
import { useSettingsContext } from '@/components/settings/use-settings-context'
import { SettingsDrawer } from '@/components/settings/settings-drawer'
import { defaultSettings } from '@/components/settings/settings-config'
import { MinimalccSidebar } from './minimalcc-sidebar'
import { MinimalccHeader } from './minimalcc-header'

interface MinimalccDashboardLayoutProps {
  children: React.ReactNode
}

export function MinimalccDashboardLayout({ children }: MinimalccDashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const settings = useSettingsContext()

  const isNavMini = settings.state.navLayout === 'mini'
  const isNavHorizontal = settings.state.navLayout === 'horizontal'
  const isNavVertical = isNavMini || settings.state.navLayout === 'vertical'

  // Apply settings to document
  if (typeof window !== 'undefined') {
    // Apply direction
    document.documentElement.dir = settings.state.direction || 'ltr'
    
    // Apply font family
    if (settings.state.fontFamily) {
      document.documentElement.style.setProperty('--font-family', settings.state.fontFamily)
    }
    
    // Apply font size
    if (settings.state.fontSize) {
      document.documentElement.style.fontSize = `${settings.state.fontSize}px`
    }
    
    // Apply color scheme
    if (settings.state.colorScheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  return (
    <div className={`
      min-h-screen bg-gray-50 dark:bg-gray-900
      ${settings.state.direction === 'rtl' ? 'rtl' : 'ltr'}
      ${settings.state.compactLayout ? 'xl:max-w-screen-xl xl:mx-auto' : ''}
    `}
    style={{ 
      fontFamily: settings.state.fontFamily,
      fontSize: `${settings.state.fontSize}px`
    }}>
      {/* Sidebar */}
      {isNavVertical && (
        <MinimalccSidebar />
      )}

      {/* Main Content */}
      <div className={`
        min-h-screen flex flex-col
        ${isNavVertical ? 'md:ml-64' : ''}
        ${isNavMini ? 'md:ml-16' : ''}
        transition-all duration-300 ease-in-out
      `}>
        {/* Header */}
        <MinimalccHeader 
          onMenuClick={() => setMobileMenuOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-6">
          <div className={`
            mx-auto w-full
            ${settings.state.compactLayout ? 'max-w-7xl' : ''}
          `}>
            {children}
          </div>
        </main>

        {/* Footer (if needed) */}
        <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3">
          <div className={`
            text-center text-sm text-gray-600 dark:text-gray-400
            ${settings.state.compactLayout ? 'max-w-7xl mx-auto' : ''}
          `}>
            <p>© 2024 Marina Pharmacy TMS. All rights reserved.</p>
          </div>
        </footer>
      </div>

      {/* Settings Drawer */}
      <SettingsDrawer defaultSettings={defaultSettings} />

      {/* Overlay for mobile menu */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-black/30"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  )
}