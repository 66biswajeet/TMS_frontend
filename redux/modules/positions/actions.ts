import { api } from "@/lib/axios";

// Action Types
export const POSITIONS_REQ = "POSITIONS_REQ" as const;
export const POSITIONS_OK = "POSITIONS_OK" as const;
export const POSITIONS_ERR = "POSITIONS_ERR" as const;

export const POSITIONS_CREATE_REQ = "POSITIONS_CREATE_REQ" as const;
export const POSITIONS_CREATE_OK = "POSITIONS_CREATE_OK" as const;
export const POSITIONS_CREATE_ERR = "POSITIONS_CREATE_ERR" as const;

export const POSITIONS_UPDATE_REQ = "POSITIONS_UPDATE_REQ" as const;
export const POSITIONS_UPDATE_OK = "POSITIONS_UPDATE_OK" as const;
export const POSITIONS_UPDATE_ERR = "POSITIONS_UPDATE_ERR" as const;

export const POSITIONS_DELETE_REQ = "POSITIONS_DELETE_REQ" as const;
export const POSITIONS_DELETE_OK = "POSITIONS_DELETE_OK" as const;
export const POSITIONS_DELETE_ERR = "POSITIONS_DELETE_ERR" as const;

// Action Creators
export const fetchPositions = () => async (dispatch: any) => {
  try {
    dispatch({ type: POSITIONS_REQ });
    const { data } = await api.get("/positions");
    dispatch({ type: POSITIONS_OK, payload: data.items || [] });
    return data.items || [];
  } catch (e: any) {
    dispatch({ type: POSITIONS_ERR, error: e?.response?.data?.error || e.message });
    throw e;
  }
};

export const createPosition = (payload: any) => async (dispatch: any) => {
  try {
    dispatch({ type: POSITIONS_CREATE_REQ });
    const { data } = await api.post("/positions", payload);
    dispatch({ type: POSITIONS_CREATE_OK, payload: data });
    // Refresh the positions list after creating a new position
    dispatch(fetchPositions());
    return data;
  } catch (e: any) {
    console.error("Error creating position:", e);
    dispatch({ type: POSITIONS_CREATE_ERR, error: e?.response?.data?.error || e.message || "Unknown error" });
    throw e;
  }
};

export const updatePosition = (id: string, payload: any) => async (dispatch: any) => {
  try {
    dispatch({ type: POSITIONS_UPDATE_REQ });
    const { data } = await api.put(`/positions/${id}`, payload);
    dispatch({ type: POSITIONS_UPDATE_OK, payload: data });
    // Refresh the positions list after updating a position
    dispatch(fetchPositions());
    return data;
  } catch (e: any) {
    dispatch({ type: POSITIONS_UPDATE_ERR, error: e?.response?.data?.error || e.message });
    throw e;
  }
};

export const deletePosition = (id: string) => async (dispatch: any) => {
  try {
    dispatch({ type: POSITIONS_DELETE_REQ });
    const { data } = await api.delete(`/positions/${id}`);
    dispatch({ type: POSITIONS_DELETE_OK, payload: data });
    // Refresh the positions list after deleting a position
    dispatch(fetchPositions());
    return data;
  } catch (e: any) {
    dispatch({ type: POSITIONS_DELETE_ERR, error: e?.response?.data?.error || e.message });
    throw e;
  }
};