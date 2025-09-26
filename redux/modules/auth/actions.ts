import { api } from "@/lib/axios";

export const AUTH_LOGIN_REQ = "AUTH_LOGIN_REQ" as const;
export const AUTH_LOGIN_OK  = "AUTH_LOGIN_OK"  as const;
export const AUTH_LOGIN_ERR = "AUTH_LOGIN_ERR" as const;
export const AUTH_LOGOUT    = "AUTH_LOGOUT"    as const;

export const login = (identifier: string, password: string) => async (dispatch: any) => {
  try {
    dispatch({ type: AUTH_LOGIN_REQ });
    const { data } = await api.post("/auth/login", { identifier, password });
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    dispatch({ type: AUTH_LOGIN_OK, payload: data });
    return data;
  } catch (e: any) {
    dispatch({ type: AUTH_LOGIN_ERR, error: e?.response?.data?.error || e.message });
    throw e;
  }
};

export const logout = () => (dispatch: any) => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  dispatch({ type: AUTH_LOGOUT });
};
