import { api } from "@/lib/axios";

export const TPL_REQ = "TPL_REQ" as const;
export const TPL_OK = "TPL_OK" as const;
export const TPL_ERR = "TPL_ERR" as const;

export const TPL_CREATE_REQ = "TPL_CREATE_REQ" as const;
export const TPL_CREATE_OK = "TPL_CREATE_OK" as const;
export const TPL_CREATE_ERR = "TPL_CREATE_ERR" as const;

export const TPL_DELETE_REQ = "TPL_DELETE_REQ" as const;
export const TPL_DELETE_OK = "TPL_DELETE_OK" as const;
export const TPL_DELETE_ERR = "TPL_DELETE_ERR" as const;

export const fetchTemplates = () => async (dispatch: any) => {
  try {
    dispatch({ type: TPL_REQ });
    const { data } = await api.get("/templates");
    dispatch({ type: TPL_OK, payload: data.items || data || [] });
    return data.items || data || [];
  }
  catch (e: any) {
    dispatch({ type: TPL_ERR, error: e?.response?.data?.error || e.message });
    throw e;
  }
};

export const createTemplate = (payload: any) => async (dispatch: any) => {
  try {
    dispatch({ type: TPL_CREATE_REQ });
    const { data } = await api.post("/templates", payload);
    dispatch({ type: TPL_CREATE_OK, payload: data });
    // Refresh templates list
    dispatch(fetchTemplates());
    return data;
  }
  catch (e: any) {
    dispatch({ type: TPL_CREATE_ERR, error: e?.response?.data?.error || e.message });
    throw e;
  }
};

export const deleteTemplate = (id: string) => async (dispatch: any) => {
  try {
    dispatch({ type: TPL_DELETE_REQ });
    const { data } = await api.delete(`/templates/${id}`);
    dispatch({ type: TPL_DELETE_OK, payload: data });
    // Refresh templates list
    dispatch(fetchTemplates());
    return data;
  }
  catch (e: any) {
    dispatch({ type: TPL_DELETE_ERR, error: e?.response?.data?.error || e.message });
    throw e;
  }
};

export const duplicateTemplate = (id: string) => async (dispatch: any) => {
  try {
    const { data } = await api.post(`/templates/${id}/duplicate`);
    // Refresh templates list
    dispatch(fetchTemplates());
    return data;
  }
  catch (e: any) {
    console.error("Error duplicating template:", e);
    throw e;
  }
};
