import { api } from "@/lib/axios";

// Action Types
export const USERS_REQ = "USERS_REQ" as const;
export const USERS_OK = "USERS_OK" as const;
export const USERS_ERR = "USERS_ERR" as const;

export const USERS_CREATE_REQ = "USERS_CREATE_REQ" as const;
export const USERS_CREATE_OK = "USERS_CREATE_OK" as const;
export const USERS_CREATE_ERR = "USERS_CREATE_ERR" as const;

export const USERS_UPDATE_REQ = "USERS_UPDATE_REQ" as const;
export const USERS_UPDATE_OK = "USERS_UPDATE_OK" as const;
export const USERS_UPDATE_ERR = "USERS_UPDATE_ERR" as const;

export const USERS_DELETE_REQ = "USERS_DELETE_REQ" as const;
export const USERS_DELETE_OK = "USERS_DELETE_OK" as const;
export const USERS_DELETE_ERR = "USERS_DELETE_ERR" as const;

// Action Creators
export const fetchUsersMinimal = (branchId?: string) => async (dispatch: any) => {
  try {
    dispatch({ type: USERS_REQ });
    let url = "/users/minimal";
    if (branchId && branchId !== "all") {
      url += `?branchId=${branchId}`;
    }
    const { data } = await api.get(url);
    dispatch({ type: USERS_OK, payload: data.items || [] });
  } catch (e: any) {
    dispatch({ type: USERS_ERR, error: e?.response?.data?.error || e.message });
  }
};

export const createUser = (payload: any) => async (dispatch: any) => {
  try {
    dispatch({ type: USERS_CREATE_REQ });
    const response = await api.post("/users", payload);
    dispatch({ type: USERS_CREATE_OK, payload: response.data });
    // Refresh the user list after creating a new user
    dispatch(fetchUsersMinimal());
    return response.data;
  } catch (e: any) {
    console.error("Error creating user:", e);
    dispatch({ type: USERS_CREATE_ERR, error: e?.response?.data?.error || e.message || "Unknown error" });
    throw e;
  }
};

export const updateUser = (id: string, payload: any) => async (dispatch: any) => {
  try {
    dispatch({ type: USERS_UPDATE_REQ });
    const response = await api.put(`/users/${id}`, payload);
    dispatch({ type: USERS_UPDATE_OK, payload: response.data });
    // Refresh the user list after updating a user
    dispatch(fetchUsersMinimal());
    return response.data;
  } catch (e: any) {
    dispatch({ type: USERS_UPDATE_ERR, error: e?.response?.data?.error || e.message });
    throw e;
  }
};

export const deleteUser = (id: string) => async (dispatch: any) => {
  try {
    dispatch({ type: USERS_DELETE_REQ });
    const response = await api.delete(`/users/${id}`);
    dispatch({ type: USERS_DELETE_OK, payload: response.data });
    // Refresh the user list after deleting a user
    dispatch(fetchUsersMinimal());
    return response.data;
  } catch (e: any) {
    dispatch({ type: USERS_DELETE_ERR, error: e?.response?.data?.error || e.message });
    throw e;
  }
};
