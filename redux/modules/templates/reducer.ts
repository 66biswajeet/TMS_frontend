type State = {
  items: any[];
  error: string | null;
  loading: boolean;
  creating: boolean;
  deleting: boolean;
};

const initial: State = {
  items: [],
  error: null,
  loading: false,
  creating: false,
  deleting: false
};

export function templatesReducer(state: State = initial, action: any): State {
  switch(action.type){
    case "TPL_REQ":
      return { ...state, loading: true, error: null };
    case "TPL_OK":
      return { ...state, loading: false, items: action.payload };
    case "TPL_ERR":
      return { ...state, loading: false, error: action.error };

    case "TPL_CREATE_REQ":
      return { ...state, creating: true, error: null };
    case "TPL_CREATE_OK":
      return { ...state, creating: false };
    case "TPL_CREATE_ERR":
      return { ...state, creating: false, error: action.error };

    case "TPL_DELETE_REQ":
      return { ...state, deleting: true, error: null };
    case "TPL_DELETE_OK":
      return { ...state, deleting: false };
    case "TPL_DELETE_ERR":
      return { ...state, deleting: false, error: action.error };

    default:
      return state;
  }
}
