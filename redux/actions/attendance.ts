import { ATT_MY_FAILURE, ATT_MY_REQUEST, ATT_MY_SUCCESS } from '../constants/actionTypes';
import { apiFetch } from '@/lib/api';

export const fetchMyAttendanceToday = () => async (dispatch: any) => {
  try {
    dispatch({ type: ATT_MY_REQUEST });
    const data = await apiFetch('/attendance/my');
    dispatch({ type: ATT_MY_SUCCESS, payload: data.record || null });
  } catch (e: any) {
    dispatch({ type: ATT_MY_FAILURE, error: e.message || 'Failed to load attendance' });
  }
};

export const checkIn = () => apiFetch('/attendance/check-in', { method: 'POST' });
export const checkOut = () => apiFetch('/attendance/check-out', { method: 'POST' });
