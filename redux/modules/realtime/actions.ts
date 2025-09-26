import {
  REALTIME_CONNECT,
  REALTIME_DISCONNECT,
  REALTIME_ERROR,
  REALTIME_ADD_EVENT,
  REALTIME_CLEAR_EVENTS,
  type RealtimeEvent,
  type RealtimeActionTypes
} from './types'

export const realtimeConnect = (): RealtimeActionTypes => ({
  type: REALTIME_CONNECT,
})

export const realtimeDisconnect = (): RealtimeActionTypes => ({
  type: REALTIME_DISCONNECT,
})

export const realtimeError = (error: string): RealtimeActionTypes => ({
  type: REALTIME_ERROR,
  payload: error,
})

export const addRealtimeEvent = (event: Omit<RealtimeEvent, 'id' | 'timestamp'>): RealtimeActionTypes => ({
  type: REALTIME_ADD_EVENT,
  payload: {
    ...event,
    id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
  },
})

export const clearRealtimeEvents = (): RealtimeActionTypes => ({
  type: REALTIME_CLEAR_EVENTS,
})

// Thunk actions for handling socket events
export const handleSocketEvent = (eventType: string, payload: any) => {
  return (dispatch: any) => {
    dispatch(addRealtimeEvent({
      type: eventType,
      payload,
    }))
  }
}