'use client'

import { useMemo, useState, useEffect, useCallback } from 'react'
import { SettingsContext } from './settings-context'
import { SETTINGS_STORAGE_KEY } from './settings-config'
import type { SettingsState, SettingsProviderProps } from './types'

// ----------------------------------------------------------------------

export function SettingsProvider({
  children,
  defaultSettings,
  storageKey = SETTINGS_STORAGE_KEY,
}: SettingsProviderProps) {
  const [state, setState] = useState<SettingsState>(defaultSettings)
  const [openDrawer, setOpenDrawer] = useState(false)

  // Load settings from localStorage on mount and apply theme immediately
  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem(storageKey)
      let finalSettings = defaultSettings
      
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings)
        // Check version and reset if different
        if (!parsedSettings.version || parsedSettings.version !== defaultSettings.version) {
          localStorage.setItem(storageKey, JSON.stringify(defaultSettings))
          finalSettings = defaultSettings
        } else {
          finalSettings = { ...defaultSettings, ...parsedSettings }
        }
      }
      
      setState(finalSettings)
      
      // Apply theme immediately on load
      if (typeof window !== 'undefined') {
        const html = document.documentElement
        if (finalSettings.colorScheme === 'dark') {
          html.classList.add('dark')
        } else {
          html.classList.remove('dark')
        }
        
        // Apply direction
        html.dir = finalSettings.direction || 'ltr'
        
        // Apply font family
        if (finalSettings.fontFamily) {
          html.style.setProperty('--font-family', finalSettings.fontFamily)
          document.body.style.fontFamily = finalSettings.fontFamily
        }
        
        // Apply font size
        if (finalSettings.fontSize) {
          html.style.fontSize = `${finalSettings.fontSize}px`
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
      setState(defaultSettings)
    }
  }, [defaultSettings, storageKey])

  // Save settings to localStorage and apply theme whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state))
      
      // Apply dark/light theme to document
      if (typeof window !== 'undefined') {
        const html = document.documentElement
        if (state.colorScheme === 'dark') {
          html.classList.add('dark')
        } else {
          html.classList.remove('dark')
        }
        
        // Apply direction
        html.dir = state.direction || 'ltr'
        
        // Apply font family
        if (state.fontFamily) {
          html.style.setProperty('--font-family', state.fontFamily)
          document.body.style.fontFamily = state.fontFamily
        }
        
        // Apply font size
        if (state.fontSize) {
          html.style.fontSize = `${state.fontSize}px`
        }
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }, [state, storageKey])

  const setField = useCallback((name: keyof SettingsState, value: SettingsState[keyof SettingsState]) => {
    setState(prev => ({ ...prev, [name]: value }))
  }, [])

  const onToggleDrawer = useCallback(() => {
    setOpenDrawer(prev => !prev)
  }, [])

  const onCloseDrawer = useCallback(() => {
    setOpenDrawer(false)
  }, [])

  const canReset = useMemo(() => {
    return JSON.stringify(state) !== JSON.stringify(defaultSettings)
  }, [state, defaultSettings])

  const onReset = useCallback(() => {
    setState(defaultSettings)
  }, [defaultSettings])

  const memoizedValue = useMemo(
    () => ({
      canReset,
      onReset,
      openDrawer,
      onCloseDrawer,
      onToggleDrawer,
      state,
      setState,
      setField,
    }),
    [canReset, onReset, openDrawer, onCloseDrawer, onToggleDrawer, state, setField]
  )

  return (
    <SettingsContext.Provider value={memoizedValue}>
      {children}
    </SettingsContext.Provider>
  )
}