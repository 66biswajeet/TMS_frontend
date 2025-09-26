'use client'

import { useState, useEffect } from 'react'
import { Bell, Settings, Globe, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useSettingsContext } from '@/components/settings/use-settings-context'
import { MinimalccAccountButton, MinimalccAccountDrawer } from './minimalcc-account-drawer'

// Language options
const languages = [
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'ar', label: 'العربية', flag: '🇸🇦' },
]

interface MinimalccHeaderProps {
  onMenuClick?: () => void
}

export function MinimalccHeader({ onMenuClick }: MinimalccHeaderProps) {
  const [currentLang, setCurrentLang] = useState(languages[0])
  const [notificationCount, setNotificationCount] = useState(3)
  const [accountDrawerOpen, setAccountDrawerOpen] = useState(false)
  const settings = useSettingsContext()

  const isNavHorizontal = settings.state.navLayout === 'horizontal'
  const isNavVertical = settings.state.navLayout === 'vertical' || settings.state.navLayout === 'mini'

  useEffect(() => {
    // Load current language from storage or state
    const savedLang = localStorage.getItem('language') || 'en'
    const lang = languages.find(l => l.value === savedLang) || languages[0]
    setCurrentLang(lang)
  }, [])

  const handleLanguageChange = (langValue: string) => {
    const lang = languages.find(l => l.value === langValue)
    if (lang) {
      setCurrentLang(lang)
      localStorage.setItem('language', langValue)
      // Apply RTL/LTR based on language
      settings.setField('direction', langValue === 'ar' ? 'rtl' : 'ltr')
    }
  }

  return (
    <header className={`
      sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60
      dark:bg-gray-900/95 dark:supports-[backdrop-filter]:bg-gray-900/60 dark:border-gray-800
      ${isNavHorizontal ? 'bg-gray-50 dark:bg-gray-800' : ''}
    `}>
      {/* Top Alert Area (Hidden by default) */}
      <div className="hidden border-b bg-blue-50 dark:bg-blue-900/20">
        <div className="container mx-auto px-4 py-2">
          <div className="text-sm text-blue-700 dark:text-blue-300 text-center">
            This is an info alert area (hidden by default)
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className={`
        flex h-16 items-center px-4 gap-4
        ${isNavVertical ? 'md:px-6' : ''}
        ${isNavHorizontal ? 'container mx-auto' : ''}
      `}>
        {/* Left Area */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden" 
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Logo for horizontal nav */}
          {isNavHorizontal && (
            <>
              <div className="hidden md:flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">M</span>
                </div>
                <span className="font-bold text-gray-900 dark:text-white">Marina TMS</span>
              </div>
              
              {/* Divider */}
              <div className="hidden md:block w-px h-6 bg-gray-200 dark:bg-gray-700" />
            </>
          )}

          {/* Workspace/Breadcrumb area */}
          <div className="hidden md:flex items-center text-sm text-gray-600 dark:text-gray-400">
            <span></span>
          </div>
        </div>

        {/* Center Area */}
        <div className="flex-1 flex justify-center">
          {/* This can be used for breadcrumbs or page title */}
        </div>

        {/* Right Area */}
        <div className="flex items-center gap-2">
          {/* Alarm/Notification Button (replacing search bar) */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative h-10 w-10"
          >
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <Badge 
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                variant="destructive"
              >
                {notificationCount}
              </Badge>
            )}
          </Button>

          {/* Language Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <Globe className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {languages.map((lang) => (
                <DropdownMenuItem 
                  key={lang.value}
                  onClick={() => handleLanguageChange(lang.value)}
                  className="flex items-center gap-2"
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span className={currentLang.value === lang.value ? 'font-medium' : ''}>
                    {lang.label}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Settings Button */}
          <Button
            variant="ghost"
            size="icon"
            className="relative h-10 w-10"
            onClick={settings.onToggleDrawer}
          >
            <Settings className="h-5 w-5" />
            {settings.canReset && (
              <Badge
                className="absolute -top-1 -right-1 h-2 w-2 rounded-full p-0"
                variant="destructive"
              />
            )}
          </Button>

          {/* Account Button */}
          <MinimalccAccountButton onClick={() => setAccountDrawerOpen(true)} />
        </div>
      </div>

      {/* Account Drawer */}
      <MinimalccAccountDrawer
        open={accountDrawerOpen}
        onClose={() => setAccountDrawerOpen(false)}
      />

      {/* Bottom Area - Navigation for horizontal layout */}
      {isNavHorizontal && (
        <div className="border-t bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
          <div className="container mx-auto px-4">
            <nav className="flex items-center gap-6 h-12">
              {/* This would contain horizontal navigation items */}
              <div className="flex items-center gap-6 text-sm">
                <a href="/" className="text-blue-600 dark:text-blue-400 font-medium">Dashboard</a>
                <a href="/tasks" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">Tasks</a>
                <a href="/templates" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">Templates</a>
                <a href="/reviews" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">Reviews</a>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}