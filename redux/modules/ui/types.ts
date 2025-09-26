export interface Toast {
  id: string
  type: 'info' | 'success' | 'error' | 'warning'
  title?: string
  message: string
  duration?: number
  dismissible?: boolean
  action?: {
    label: string
    onClick: () => void
  }
}

export interface UIState {
  sidebarCollapsed: boolean
  sidebarOpen: boolean
  toasts: Toast[]
  notificationCount: number
}

export const UI_TOGGLE_SIDEBAR = 'UI_TOGGLE_SIDEBAR'
export const UI_SET_SIDEBAR_COLLAPSED = 'UI_SET_SIDEBAR_COLLAPSED'
export const UI_SET_SIDEBAR_OPEN = 'UI_SET_SIDEBAR_OPEN'
export const UI_ADD_TOAST = 'UI_ADD_TOAST'
export const UI_REMOVE_TOAST = 'UI_REMOVE_TOAST'
export const UI_CLEAR_TOASTS = 'UI_CLEAR_TOASTS'
export const UI_SET_NOTIFICATION_COUNT = 'UI_SET_NOTIFICATION_COUNT'

export interface ToggleSidebarAction {
  type: typeof UI_TOGGLE_SIDEBAR
}

export interface SetSidebarCollapsedAction {
  type: typeof UI_SET_SIDEBAR_COLLAPSED
  payload: boolean
}

export interface SetSidebarOpenAction {
  type: typeof UI_SET_SIDEBAR_OPEN
  payload: boolean
}

export interface AddToastAction {
  type: typeof UI_ADD_TOAST
  payload: Toast
}

export interface RemoveToastAction {
  type: typeof UI_REMOVE_TOAST
  payload: string
}

export interface ClearToastsAction {
  type: typeof UI_CLEAR_TOASTS
}

export interface SetNotificationCountAction {
  type: typeof UI_SET_NOTIFICATION_COUNT
  payload: number
}

export type UIActionTypes =
  | ToggleSidebarAction
  | SetSidebarCollapsedAction
  | SetSidebarOpenAction
  | AddToastAction
  | RemoveToastAction
  | ClearToastsAction
  | SetNotificationCountAction