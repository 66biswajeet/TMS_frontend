import {
  REALTIME_CONNECT,
  REALTIME_DISCONNECT,
  REALTIME_ERROR,
  REALTIME_ADD_EVENT,
  REALTIME_CLEAR_EVENTS,
  type RealtimeState,
  type RealtimeActionTypes
} from './types'

const initialState: RealtimeState = {
  connected: false,
  error: null,
  events: [],
  lastEventTime: null,
}

export function realtimeReducer(state: RealtimeState = initialState, action: RealtimeActionTypes): RealtimeState {
  switch (action.type) {
    case REALTIME_CONNECT:
      return {
        ...state,
        connected: true,
        error: null,
      }

    case REALTIME_DISCONNECT:
      return {
        ...state,
        connected: false,
      }

    case REALTIME_ERROR:
      return {
        ...state,
        connected: false,
        error: action.payload,
      }

    case REALTIME_ADD_EVENT:
      return {
        ...state,
        events: [action.payload, ...state.events].slice(0, 100), // Keep last 100 events
        lastEventTime: action.payload.timestamp,
      }

    case REALTIME_CLEAR_EVENTS:
      return {
        ...state,
        events: [],
      }

    default:
      return state
  }
}