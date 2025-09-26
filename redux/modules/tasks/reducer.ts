import {
  TASKS_ERR, TASKS_OK, TASKS_REQ,
  WORKFLOW_TASKS_REQ, WORKFLOW_TASKS_OK, WORKFLOW_TASKS_ERR,
  TASK_UPDATE_REQ, TASK_UPDATE_OK, TASK_UPDATE_ERR
} from "./actions";

type State = {
  loading: boolean;
  error: string | null;
  items: any[];
  workflowTasks: any[];
  workflowLoading: boolean;
  updating: boolean;
  updateError: string | null;
};

const initial: State = {
  loading: false,
  error: null,
  items: [],
  workflowTasks: [],
  workflowLoading: false,
  updating: false,
  updateError: null
};

export function tasksReducer(state: State = initial, action: any): State {
  switch(action.type){
    case TASKS_REQ:
      return { ...state, loading: true, error: null };
    case TASKS_OK:
      return { ...state, loading: false, items: action.payload || [] };
    case TASKS_ERR:
      return { ...state, loading: false, error: action.error };
      
    case WORKFLOW_TASKS_REQ:
      return { ...state, workflowLoading: true, error: null };
    case WORKFLOW_TASKS_OK:
      return { ...state, workflowLoading: false, workflowTasks: action.payload || [] };
    case WORKFLOW_TASKS_ERR:
      return { ...state, workflowLoading: false, error: action.error };
      
    case TASK_UPDATE_REQ:
      return { ...state, updating: true, updateError: null };
    case TASK_UPDATE_OK:
      return { ...state, updating: false };
    case TASK_UPDATE_ERR:
      return { ...state, updating: false, updateError: action.error };
      
    default:
      return state;
  }
}
