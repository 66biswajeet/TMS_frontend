import { api } from "@/lib/axios";

export const TASKS_REQ = "TASKS_REQ" as const;
export const TASKS_OK  = "TASKS_OK"  as const;
export const TASKS_ERR = "TASKS_ERR" as const;

export const WORKFLOW_TASKS_REQ = "WORKFLOW_TASKS_REQ" as const;
export const WORKFLOW_TASKS_OK  = "WORKFLOW_TASKS_OK"  as const;
export const WORKFLOW_TASKS_ERR = "WORKFLOW_TASKS_ERR" as const;

export const TASK_UPDATE_REQ = "TASK_UPDATE_REQ" as const;
export const TASK_UPDATE_OK  = "TASK_UPDATE_OK"  as const;
export const TASK_UPDATE_ERR = "TASK_UPDATE_ERR" as const;

export const fetchMyTasks = () => async (dispatch:any) => {
  try {
    dispatch({ type: TASKS_REQ });
    const { data } = await api.get("/tasks/my");
    dispatch({ type: TASKS_OK, payload: data.items || [] });
  } catch (e:any) {
    dispatch({ type: TASKS_ERR, error: e?.response?.data?.error || e.message });
  }
};

// Enhanced hierarchical workflow actions
export const fetchWorkflowTasks = (role?: string, branchId?: string) => async (dispatch:any) => {
  try {
    dispatch({ type: WORKFLOW_TASKS_REQ });
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (branchId) params.append('branchId', branchId);
    
    const { data } = await api.get(`/tasks/workflow?${params.toString()}`);
    dispatch({ type: WORKFLOW_TASKS_OK, payload: data.items || [] });
  } catch (e:any) {
    dispatch({ type: WORKFLOW_TASKS_ERR, error: e?.response?.data?.error || e.message });
  }
};

export const updateTaskStatus = (taskId: string, status: string, notes?: string) => async (dispatch:any) => {
  try {
    dispatch({ type: TASK_UPDATE_REQ });
    const { data } = await api.post(`/tasks/${taskId}/status`, { status, notes });
    dispatch({ type: TASK_UPDATE_OK, payload: data });
    // Refresh tasks after update
    dispatch(fetchMyTasks() as any);
  } catch (e:any) {
    dispatch({ type: TASK_UPDATE_ERR, error: e?.response?.data?.error || e.message });
  }
};

export const forwardTask = (taskId: string, toUserId: string, notes?: string) => async (dispatch:any) => {
  try {
    dispatch({ type: TASK_UPDATE_REQ });
    const { data } = await api.post(`/tasks/${taskId}/forward`, { toUserId, notes });
    dispatch({ type: TASK_UPDATE_OK, payload: data });
    // Refresh tasks after forward
    dispatch(fetchMyTasks() as any);
  } catch (e:any) {
    dispatch({ type: TASK_UPDATE_ERR, error: e?.response?.data?.error || e.message });
  }
};

export const fetchAllTasks = () => async (dispatch: any) => {
  try {
    dispatch({ type: TASKS_REQ });
    const { data } = await api.get("/tasks");
    dispatch({ type: TASKS_OK, payload: data.items || [] });
    return data.items || [];
  } catch (e: any) {
    dispatch({ type: TASKS_ERR, error: e?.response?.data?.error || e.message });
    throw e;
  }
};

export const fetchPendingReviews = () => async (dispatch: any) => {
  try {
    dispatch({ type: TASKS_REQ });
    const { data } = await api.get("/tasks/pending-reviews");
    dispatch({ type: TASKS_OK, payload: data.items || [] });
    return data.items || [];
  } catch (e: any) {
    dispatch({ type: TASKS_ERR, error: e?.response?.data?.error || e.message });
    throw e;
  }
};

export const assignTask = (taskId: string, userIds: string[]) => async (dispatch: any) => {
  try {
    const { data } = await api.post("/tasks/assign", { taskId, userIds });
    return data;
  } catch (e: any) {
    console.error("Error assigning task:", e);
    throw e;
  }
};

export const submitTask = (taskId: string, checklistJson: any, notes?: string) => async (dispatch: any) => {
  try {
    const { data } = await api.post("/tasks/submit", { taskId, checklistJson, notes });
    return data;
  } catch (e: any) {
    console.error("Error submitting task:", e);
    throw e;
  }
};

export const approveTask = (taskId: string) => async (dispatch: any) => {
  try {
    const { data } = await api.post("/tasks/approve", { taskId });
    return data;
  } catch (e: any) {
    console.error("Error approving task:", e);
    throw e;
  }
};

export const rejectTask = (taskId: string, reason: string) => async (dispatch: any) => {
  try {
    const { data } = await api.post("/tasks/reject", { taskId, reason });
    return data;
  } catch (e: any) {
    console.error("Error rejecting task:", e);
    throw e;
  }
};

export const createDaily = (scope: string, branchId: string) => async (dispatch: any) => {
  try {
    const { data } = await api.post("/tasks/create-daily", { scope, branchId });
    return data;
  } catch (e: any) {
    console.error("Error creating daily task:", e);
    throw e;
  }
};
