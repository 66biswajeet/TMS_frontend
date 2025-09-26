import { ATT_MY_FAILURE, ATT_MY_REQUEST, ATT_MY_SUCCESS } from '../constants/actionTypes';

type State = { loading: boolean; error: string | null; record: any | null; };
const initial: State = { loading: false, error: null, record: null };

export function attendanceReducer(state: State = initial, action: any): State {
  switch (action.type) {
    case ATT_MY_REQUEST: return { ...state, loading: true, error: null };
    case ATT_MY_SUCCESS: return { ...state, loading: false, record: action.payload };
    case ATT_MY_FAILURE: return { ...state, loading: false, error: action.error };
    default: return state;
  }
}
