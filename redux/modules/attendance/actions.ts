import { api } from "@/lib/axios";

export const ATT_REQ = "ATT_REQ" as const;
export const ATT_OK = "ATT_OK" as const;
export const ATT_ERR = "ATT_ERR" as const;

export const ATT_CHECKIN_REQ = "ATT_CHECKIN_REQ" as const;
export const ATT_CHECKIN_OK = "ATT_CHECKIN_OK" as const;
export const ATT_CHECKIN_ERR = "ATT_CHECKIN_ERR" as const;

export const ATT_CHECKOUT_REQ = "ATT_CHECKOUT_REQ" as const;
export const ATT_CHECKOUT_OK = "ATT_CHECKOUT_OK" as const;
export const ATT_CHECKOUT_ERR = "ATT_CHECKOUT_ERR" as const;

export const fetchMyAttendance = () => async (dispatch: any) => {
  try {
    dispatch({ type: ATT_REQ });
    const { data } = await api.get("/attendance/my");
    dispatch({ type: ATT_OK, payload: data.record || null });
    return data.record || null;
  }
  catch (e: any) {
    dispatch({ type: ATT_ERR, error: e?.response?.data?.error || e.message });
    throw e;
  }
};

export const checkIn = () => async (dispatch: any) => {
  try {
    dispatch({ type: ATT_CHECKIN_REQ });
    const { data } = await api.post("/attendance/check-in");
    dispatch({ type: ATT_CHECKIN_OK, payload: data });
    // Refresh attendance data
    dispatch(fetchMyAttendance());
    return data;
  }
  catch (e: any) {
    dispatch({ type: ATT_CHECKIN_ERR, error: e?.response?.data?.error || e.message });
    throw e;
  }
};

export const checkOut = () => async (dispatch: any) => {
  try {
    dispatch({ type: ATT_CHECKOUT_REQ });
    const { data } = await api.post("/attendance/check-out");
    dispatch({ type: ATT_CHECKOUT_OK, payload: data });
    // Refresh attendance data
    dispatch(fetchMyAttendance());
    return data;
  }
  catch (e: any) {
    dispatch({ type: ATT_CHECKOUT_ERR, error: e?.response?.data?.error || e.message });
    throw e;
  }
};
