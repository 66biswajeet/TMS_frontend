import type { SettingsState } from './types'

// ----------------------------------------------------------------------

export const SETTINGS_STORAGE_KEY: string = 'tms-settings'

export const defaultSettings: SettingsState = {
  colorScheme: 'light',
  direction: 'ltr',
  contrast: 'default',
  navLayout: 'vertical',
  primaryColor: 'preset1',
  navColor: 'integrate',
  compactLayout: false,
  fontSize: 16,
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  version: '1.0.0',
}