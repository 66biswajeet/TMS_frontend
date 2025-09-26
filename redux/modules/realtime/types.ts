export interface RealtimeState {
  connected: boolean
  error: string | null
  events: RealtimeEvent[]
  lastEventTime: number | null
}

export interface RealtimeEvent {
  id: string
  type: string
  payload: any
  timestamp: number
  userId?: string
  branchId?: string
  role?: string
}

export const REALTIME_CONNECT = 'REALTIME_CONNECT'
export const REALTIME_DISCONNECT = 'REALTIME_DISCONNECT'
export const REALTIME_ERROR = 'REALTIME_ERROR'
export const REALTIME_ADD_EVENT = 'REALTIME_ADD_EVENT'
export const REALTIME_CLEAR_EVENTS = 'REALTIME_CLEAR_EVENTS'

export interface RealtimeConnectAction {
  type: typeof REALTIME_CONNECT
}

export interface RealtimeDisconnectAction {
  type: typeof REALTIME_DISCONNECT
}

export interface RealtimeErrorAction {
  type: typeof REALTIME_ERROR
  payload: string
}

export interface RealtimeAddEventAction {
  type: typeof REALTIME_ADD_EVENT
  payload: RealtimeEvent
}

export interface RealtimeClearEventsAction {
  type: typeof REALTIME_CLEAR_EVENTS
}

export type RealtimeActionTypes =
  | RealtimeConnectAction
  | RealtimeDisconnectAction
  | RealtimeErrorAction
  | RealtimeAddEventAction
  | RealtimeClearEventsAction

// Event types for the TMS system
export const TMS_EVENTS = {
  TASK_CREATED: 'task:created',
  TASK_UPDATED: 'task:updated',
  TASK_SUBMITTED: 'task:submitted',
  TASK_FORWARDED: 'task:forwarded',
  TASK_APPROVED: 'task:approved',
  TASK_REJECTED: 'task:rejected',
  CHECKLIST_APPENDED: 'checklist:appended',
  ANALYTICS_REFRESH: 'analytics:refresh',
  USER_ASSIGNMENT_CHANGED: 'user:assignment_changed',
  NOTIFICATION_NEW: 'notification:new',
} as const

export type TMSEventType = typeof TMS_EVENTS[keyof typeof TMS_EVENTS]