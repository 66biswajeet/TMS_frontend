import { AUTH_LOGIN_FAILURE,
         AUTH_LOGIN_REQUEST, 
         AUTH_LOGIN_SUCCESS, 
         AUTH_LOGOUT } 
         from '../constants/actionTypes';

type State = {
  loading: boolean;
  error: string | null;
  token: string | null;
  user: any | null;
};

const initial: State = {
  loading: false,
  error: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  user: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null,
};

export function authReducer(state: State = initial, action: any): State {
  switch (action.type) {
    case AUTH_LOGIN_REQUEST:
      return { ...state, loading: true, error: null };
    case AUTH_LOGIN_SUCCESS:
      return { ...state, loading: false, token: action.payload.token, user: action.payload.user };
    case AUTH_LOGIN_FAILURE:
      return { ...state, loading: false, error: action.error };
    case AUTH_LOGOUT:
      return { ...state, token: null, user: null };
    default:
      return state;
  }
}
