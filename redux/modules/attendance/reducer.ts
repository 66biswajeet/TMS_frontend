type State = {
  record: any | null;
  error: string | null;
  loading: boolean;
  checkingIn: boolean;
  checkingOut: boolean;
};

const initial: State = {
  record: null,
  error: null,
  loading: false,
  checkingIn: false,
  checkingOut: false
};

export function attendanceReducer(state: State = initial, action: any): State {
  switch(action.type){
    case "ATT_REQ":
      return { ...state, loading: true, error: null };
    case "ATT_OK":
      return { ...state, loading: false, record: action.payload };
    case "ATT_ERR":
      return { ...state, loading: false, error: action.error };

    case "ATT_CHECKIN_REQ":
      return { ...state, checkingIn: true, error: null };
    case "ATT_CHECKIN_OK":
      return { ...state, checkingIn: false };
    case "ATT_CHECKIN_ERR":
      return { ...state, checkingIn: false, error: action.error };

    case "ATT_CHECKOUT_REQ":
      return { ...state, checkingOut: true, error: null };
    case "ATT_CHECKOUT_OK":
      return { ...state, checkingOut: false };
    case "ATT_CHECKOUT_ERR":
      return { ...state, checkingOut: false, error: action.error };

    default:
      return state;
  }
}
