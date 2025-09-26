import { AUTH_LOGIN_ERR, AUTH_LOGIN_OK, AUTH_LOGIN_REQ, AUTH_LOGOUT } from "./actions";

type State = {
  loading: boolean; error: string | null; token: string | null; user: any | null;
};
const initial: State = {
  loading: false,
  error: null,
  token: typeof window !== "undefined" ? localStorage.getItem("token") : null,
  user: typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "null") : null,
};

export function authReducer(state: State = initial, action: any): State {
  switch (action.type) {
    case AUTH_LOGIN_REQ: return { ...state, loading: true, error: null };
    case AUTH_LOGIN_OK:  return { ...state, loading: false, token: action.payload.token, user: action.payload.user };
    case AUTH_LOGIN_ERR: return { ...state, loading: false, error: action.error };
    case AUTH_LOGOUT:    return { ...state, token: null, user: null };
    default: return state;
  }
}
