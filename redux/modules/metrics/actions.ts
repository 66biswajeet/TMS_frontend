import { api } from "@/lib/axios";

export const MET_REQ = "MET_REQ" as const;
export const MET_OK = "MET_OK" as const;
export const MET_ERR = "MET_ERR" as const;

export const fetchMetrics = () => async (dispatch: any) => {
  try {
    dispatch({ type: MET_REQ });
    const { data } = await api.get("/metrics/management");
    dispatch({ type: MET_OK, payload: data });
    return data;
  }
  catch (e: any) {
    dispatch({ type: MET_ERR, error: e?.response?.data?.error || e.message });
    throw e;
  }
};
