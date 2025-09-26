import {
  UI_TOGGLE_SIDEBAR,
  UI_SET_SIDEBAR_COLLAPSED,
  UI_SET_SIDEBAR_OPEN,
  UI_ADD_TOAST,
  UI_REMOVE_TOAST,
  UI_CLEAR_TOASTS,
  UI_SET_NOTIFICATION_COUNT,
  type Toast,
  type UIActionTypes
} from './types'

export const toggleSidebar = (): UIActionTypes => ({
  type: UI_TOGGLE_SIDEBAR,
})

export const setSidebarCollapsed = (collapsed: boolean): UIActionTypes => ({
  type: UI_SET_SIDEBAR_COLLAPSED,
  payload: collapsed,
})

export const setSidebarOpen = (open: boolean): UIActionTypes => ({
  type: UI_SET_SIDEBAR_OPEN,
  payload: open,
})

export const addToast = (toast: Omit<Toast, 'id'>): UIActionTypes => ({
  type: UI_ADD_TOAST,
  payload: {
    ...toast,
    id: `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  },
})

export const removeToast = (id: string): UIActionTypes => ({
  type: UI_REMOVE_TOAST,
  payload: id,
})

export const clearToasts = (): UIActionTypes => ({
  type: UI_CLEAR_TOASTS,
})

export const setNotificationCount = (count: number): UIActionTypes => ({
  type: UI_SET_NOTIFICATION_COUNT,
  payload: count,
})

// Convenience toast creators
export const showSuccessToast = (message: string, title?: string) => 
  addToast({ type: 'success', message, title })

export const showErrorToast = (message: string, title?: string) => 
  addToast({ type: 'error', message, title })

export const showInfoToast = (message: string, title?: string) => 
  addToast({ type: 'info', message, title })

export const showWarningToast = (message: string, title?: string) => 
  addToast({ type: 'warning', message, title })