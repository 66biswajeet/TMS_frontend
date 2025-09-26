import { AUTH_LOGIN_FAILURE, AUTH_LOGIN_REQUEST, AUTH_LOGIN_SUCCESS, AUTH_LOGOUT } from '../constants/actionTypes';
import { API_BASE } from '@/lib/api';

export const login = (identifier: string, password: string) => async (dispatch: any) => {
  try {
    dispatch({ type: AUTH_LOGIN_REQUEST });
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || 'Login failed');
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('userRole', data.user.role);
    localStorage.setItem('userName', data.user.name);
    dispatch({ type: AUTH_LOGIN_SUCCESS, payload: data });
    return data;
  } catch (e: any) {
    dispatch({ type: AUTH_LOGIN_FAILURE, error: e.message || 'Login failed' });
    throw e;
  }
};

export const logout = () => (dispatch: any) => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userName');
  dispatch({ type: AUTH_LOGOUT });
};
