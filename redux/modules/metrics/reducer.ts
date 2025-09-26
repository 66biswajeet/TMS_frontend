type State = {
  data: any | null;
  error: string | null;
  loading: boolean;
};

const initial: State = {
  data: null,
  error: null,
  loading: false
};

export function metricsReducer(state: State = initial, action: any): State {
  switch(action.type){
    case "MET_REQ":
      return { ...state, loading: true, error: null };
    case "MET_OK":
      return { ...state, loading: false, data: action.payload };
    case "MET_ERR":
      return { ...state, loading: false, error: action.error };
    default:
      return state;
  }
}
