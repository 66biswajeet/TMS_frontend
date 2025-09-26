import { TASKS_FETCH_FAILURE, TASKS_FETCH_REQUEST, TASKS_FETCH_SUCCESS } from '../constants/actionTypes';
import { apiFetch } from '@/lib/api';

export const fetchMyTasks = () => async (dispatch: any) => {
  try {
    dispatch({ type: TASKS_FETCH_REQUEST });
    const data = await apiFetch('/tasks/my');
    dispatch({ type: TASKS_FETCH_SUCCESS, payload: data.items || [] });
  } catch (e: any) {
    dispatch({ type: TASKS_FETCH_FAILURE, error: e.message || 'Failed to load tasks' });
  }
};
