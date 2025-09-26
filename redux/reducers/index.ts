import { combineReducers } from 'redux';
import { authReducer } from './authReducer';
import { tasksReducer } from './tasksReducer';
import { attendanceReducer } from './attendanceReducer';

export const rootReducer = combineReducers({
  auth: authReducer,
  tasks: tasksReducer,
  attendance: attendanceReducer
});

export type RootState = ReturnType<typeof rootReducer>;
