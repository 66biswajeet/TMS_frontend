import { applyMiddleware, combineReducers, compose, createStore } from "redux";
import { thunk } from "redux-thunk";
import { authReducer } from "./modules/auth/reducer";
import { tasksReducer } from "./modules/tasks/reducer";
import { usersReducer } from "./modules/users/reducer";
import { rolesReducer } from "./modules/roles/reducer";
import { branchesReducer } from "./modules/branches/reducer";
import { metricsReducer } from "./modules/metrics/reducer";
import { attendanceReducer } from "./modules/attendance/reducer";
import { templatesReducer } from "./modules/templates/reducer";
import { positionsReducer } from "./modules/positions/reducer";
import { uiReducer } from "./modules/ui/reducer";
import { realtimeReducer } from "./modules/realtime/reducer";

const rootReducer = combineReducers({
  auth: authReducer,
  tasks: tasksReducer,
  users: usersReducer,
  roles: rolesReducer,
  branches: branchesReducer,
  metrics: metricsReducer,
  attendance: attendanceReducer,
  templates: templatesReducer,
  positions: positionsReducer,
  ui: uiReducer,
  realtime: realtimeReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

const composeEnhancers =
  (typeof window !== "undefined" &&
    (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) ||
  compose;

export const store = createStore(
  rootReducer,
  composeEnhancers(applyMiddleware(thunk))
);

// Export AppDispatch type for typed useDispatch in components
export type AppDispatch = typeof store.dispatch;
