import {
  UI_TOGGLE_SIDEBAR,
  UI_SET_SIDEBAR_COLLAPSED,
  UI_SET_SIDEBAR_OPEN,
  UI_ADD_TOAST,
  UI_REMOVE_TOAST,
  UI_CLEAR_TOASTS,
  UI_SET_NOTIFICATION_COUNT,
  type UIState,
  type UIActionTypes
} from './types'

const initialState: UIState = {
  sidebarCollapsed: false,
  sidebarOpen: false,
  toasts: [],
  notificationCount: 0,
}

export function uiReducer(state: UIState = initialState, action: UIActionTypes): UIState {
  switch (action.type) {
    case UI_TOGGLE_SIDEBAR:
      return {
        ...state,
        sidebarCollapsed: !state.sidebarCollapsed,
      }

    case UI_SET_SIDEBAR_COLLAPSED:
      return {
        ...state,
        sidebarCollapsed: action.payload,
      }

    case UI_SET_SIDEBAR_OPEN:
      return {
        ...state,
        sidebarOpen: action.payload,
      }

    case UI_ADD_TOAST:
      return {
        ...state,
        toasts: [...state.toasts, action.payload],
      }

    case UI_REMOVE_TOAST:
      return {
        ...state,
        toasts: state.toasts.filter(toast => toast.id !== action.payload),
      }

    case UI_CLEAR_TOASTS:
      return {
        ...state,
        toasts: [],
      }

    case UI_SET_NOTIFICATION_COUNT:
      return {
        ...state,
        notificationCount: action.payload,
      }

    default:
      return state
  }
}