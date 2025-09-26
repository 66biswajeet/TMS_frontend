export type ThemeDirection = 'ltr' | 'rtl'
export type ThemeColorScheme = 'light' | 'dark'

export type SettingsState = {
  version?: string
  fontSize?: number
  fontFamily?: string
  compactLayout?: boolean
  direction?: ThemeDirection
  colorScheme?: ThemeColorScheme
  contrast?: 'default' | 'high'
  navColor?: 'integrate' | 'apparent'
  navLayout?: 'vertical' | 'horizontal' | 'mini'
  primaryColor?: 'default' | 'preset1' | 'preset2' | 'preset3' | 'preset4' | 'preset5'
}

export type SettingsContextValue = {
  state: SettingsState
  canReset: boolean
  onReset: () => void
  setState: (updateValue: Partial<SettingsState>) => void
  setField: (name: keyof SettingsState, updateValue: SettingsState[keyof SettingsState]) => void
  // Drawer
  openDrawer: boolean
  onCloseDrawer: () => void
  onToggleDrawer: () => void
}

export type SettingsProviderProps = {
  children: React.ReactNode
  defaultSettings: SettingsState
  storageKey?: string
}

export type SettingsDrawerProps = {
  defaultSettings: SettingsState
}