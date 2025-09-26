import { api } from "@/lib/axios";

export const ROLES_REQ = "ROLES_REQ" as const;
export const ROLES_OK = "ROLES_OK" as const;
export const ROLES_ERR = "ROLES_ERR" as const;

export const ROLES_CREATE_REQ = "ROLES_CREATE_REQ" as const;
export const ROLES_CREATE_OK = "ROLES_CREATE_OK" as const;
export const ROLES_CREATE_ERR = "ROLES_CREATE_ERR" as const;

export const ROLES_UPDATE_REQ = "ROLES_UPDATE_REQ" as const;
export const ROLES_UPDATE_OK = "ROLES_UPDATE_OK" as const;
export const ROLES_UPDATE_ERR = "ROLES_UPDATE_ERR" as const;

export const ROLES_DELETE_REQ = "ROLES_DELETE_REQ" as const;
export const ROLES_DELETE_OK = "ROLES_DELETE_OK" as const;
export const ROLES_DELETE_ERR = "ROLES_DELETE_ERR" as const;

export const fetchRoles = () => async (dispatch: any) => {
  try {
    dispatch({ type: ROLES_REQ });
    const { data } = await api.get("/roles");
    dispatch({ type: ROLES_OK, payload: data.items || data || [] });
    return data.items || data || [];
  }
  catch (e: any) {
    dispatch({ type: ROLES_ERR, error: e?.response?.data?.error || e.message });
    throw e;
  }
};

export const createRole = (payload: any) => async (dispatch: any) => {
  try {
    dispatch({ type: ROLES_CREATE_REQ });
    const { data } = await api.post("/roles", payload);
    dispatch({ type: ROLES_CREATE_OK, payload: data });
    // Refresh roles list
    dispatch(fetchRoles());
    return data;
  }
  catch (e: any) {
    dispatch({ type: ROLES_CREATE_ERR, error: e?.response?.data?.error || e.message });
    throw e;
  }
};

export const updateRole = (id: string, payload: any) => async (dispatch: any) => {
  try {
    dispatch({ type: ROLES_UPDATE_REQ });
    const { data } = await api.put(`/roles/${id}`, payload);
    dispatch({ type: ROLES_UPDATE_OK, payload: data });
    // Refresh roles list
    dispatch(fetchRoles());
    return data;
  }
  catch (e: any) {
    dispatch({ type: ROLES_UPDATE_ERR, error: e?.response?.data?.error || e.message });
    throw e;
  }
};

export const deleteRole = (id: string) => async (dispatch: any) => {
  try {
    dispatch({ type: ROLES_DELETE_REQ });
    const { data } = await api.delete(`/roles/${id}`);
    dispatch({ type: ROLES_DELETE_OK, payload: data });
    // Refresh roles list
    dispatch(fetchRoles());
    return data;
  }
  catch (e: any) {
    dispatch({ type: ROLES_DELETE_ERR, error: e?.response?.data?.error || e.message });
    throw e;
  }
};
