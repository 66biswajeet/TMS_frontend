import { TASKS_FETCH_FAILURE, TASKS_FETCH_REQUEST, TASKS_FETCH_SUCCESS } from '../constants/actionTypes';

type State = { loading: boolean; error: string | null; items: any[]; };
const initial: State = { loading: false, error: null, items: [] };

export function tasksReducer(state: State = initial, action: any): State {
  switch (action.type) {
    case TASKS_FETCH_REQUEST: return { ...state, loading: true, error: null };
    case TASKS_FETCH_SUCCESS: return { ...state, loading: false, items: action.payload };
    case TASKS_FETCH_FAILURE: return { ...state, loading: false, error: action.error };
    default: return state;
  }
}
