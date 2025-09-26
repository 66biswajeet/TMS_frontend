import { api } from "@/lib/axios";

export const BRANCHES_REQ = "BRANCHES_REQ" as const;
export const BRANCHES_OK = "BRANCHES_OK" as const;
export const BRANCHES_ERR = "BRANCHES_ERR" as const;

export const BRANCHES_CREATE_REQ = "BRANCHES_CREATE_REQ" as const;
export const BRANCHES_CREATE_OK = "BRANCHES_CREATE_OK" as const;
export const BRANCHES_CREATE_ERR = "BRANCHES_CREATE_ERR" as const;

export const BRANCHES_UPDATE_REQ = "BRANCHES_UPDATE_REQ" as const;
export const BRANCHES_UPDATE_OK = "BRANCHES_UPDATE_OK" as const;
export const BRANCHES_UPDATE_ERR = "BRANCHES_UPDATE_ERR" as const;

export const BRANCHES_DELETE_REQ = "BRANCHES_DELETE_REQ" as const;
export const BRANCHES_DELETE_OK = "BRANCHES_DELETE_OK" as const;
export const BRANCHES_DELETE_ERR = "BRANCHES_DELETE_ERR" as const;

// Action types for users in branch
export const BRANCH_USERS_REQ = "BRANCH_USERS_REQ" as const;
export const BRANCH_USERS_OK = "BRANCH_USERS_OK" as const;
export const BRANCH_USERS_ERR = "BRANCH_USERS_ERR" as const;

// Action types for assigning users to branch
export const ASSIGN_USERS_REQ = "ASSIGN_USERS_REQ" as const;
export const ASSIGN_USERS_OK = "ASSIGN_USERS_OK" as const;
export const ASSIGN_USERS_ERR = "ASSIGN_USERS_ERR" as const;

export const fetchBranches = () => async (dispatch: any) => {
  try {
    dispatch({ type: BRANCHES_REQ });
    const { data } = await api.get("/branches");
    dispatch({ type: BRANCHES_OK, payload: data.items || data || [] });
    return data.items || data || [];
  }
  catch (e: any) {
    dispatch({ type: BRANCHES_ERR, error: e?.response?.data?.error || e.message });
    throw e;
  }
};

export const createBranch = (payload: any) => async (dispatch: any) => {
  try {
    dispatch({ type: BRANCHES_CREATE_REQ });
    const { data } = await api.post("/branches", payload);
    dispatch({ type: BRANCHES_CREATE_OK, payload: data });
    // Refresh branches list
    dispatch(fetchBranches());
    return data;
  }
  catch (e: any) {
    dispatch({ type: BRANCHES_CREATE_ERR, error: e?.response?.data?.error || e.message });
    throw e;
  }
};

export const updateBranch = (id: string, payload: any) => async (dispatch: any) => {
  try {
    dispatch({ type: BRANCHES_UPDATE_REQ });
    const { data } = await api.put(`/branches/${id}`, payload);
    dispatch({ type: BRANCHES_UPDATE_OK, payload: data });
    // Refresh branches list
    dispatch(fetchBranches());
    return data;
  }
  catch (e: any) {
    dispatch({ type: BRANCHES_UPDATE_ERR, error: e?.response?.data?.error || e.message });
    throw e;
  }
};

export const deleteBranch = (id: string) => async (dispatch: any) => {
  try {
    dispatch({ type: BRANCHES_DELETE_REQ });
    const { data } = await api.delete(`/branches/${id}`);
    dispatch({ type: BRANCHES_DELETE_OK, payload: data });
    // Refresh branches list
    dispatch(fetchBranches());
    return data;
  }
  catch (e: any) {
    dispatch({ type: BRANCHES_DELETE_ERR, error: e?.response?.data?.error || e.message });
    throw e;
  }
};

// Get users in a specific branch
export const fetchUsersInBranch = (branchId: string) => async (dispatch: any) => {
  try {
    dispatch({ type: BRANCH_USERS_REQ });
    const { data } = await api.get(`/branches/${branchId}/users`);
    dispatch({ type: BRANCH_USERS_OK, payload: { branchId, users: data.items || [] } });
    return data.items || [];
  }
  catch (e: any) {
    dispatch({ type: BRANCH_USERS_ERR, error: e?.response?.data?.error || e.message });
    throw e;
  }
};

// Assign users to a branch
export const assignUsersToBranch = (branchId: string, userIds: string[]) => async (dispatch: any) => {
  try {
    dispatch({ type: ASSIGN_USERS_REQ });
    const { data } = await api.post(`/branches/${branchId}/assign-users`, { userIds });
    dispatch({ type: ASSIGN_USERS_OK, payload: { branchId, userIds } });
    return data;
  }
  catch (e: any) {
    dispatch({ type: ASSIGN_USERS_ERR, error: e?.response?.data?.error || e.message });
    throw e;
  }
};
