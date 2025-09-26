type State = {
  items: any[];
  error: string | null;
  loading: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
};

const initial: State = {
  items: [],
  error: null,
  loading: false,
  creating: false,
  updating: false,
  deleting: false
};

export function rolesReducer(state: State = initial, action: any): State {
  switch(action.type){
    case "ROLES_REQ":
      return { ...state, loading: true, error: null };
    case "ROLES_OK":
      return { ...state, loading: false, items: action.payload };
    case "ROLES_ERR":
      return { ...state, loading: false, error: action.error };

    case "ROLES_CREATE_REQ":
      return { ...state, creating: true, error: null };
    case "ROLES_CREATE_OK":
      return { ...state, creating: false };
    case "ROLES_CREATE_ERR":
      return { ...state, creating: false, error: action.error };

    case "ROLES_UPDATE_REQ":
      return { ...state, updating: true, error: null };
    case "ROLES_UPDATE_OK":
      return { ...state, updating: false };
    case "ROLES_UPDATE_ERR":
      return { ...state, updating: false, error: action.error };

    case "ROLES_DELETE_REQ":
      return { ...state, deleting: true, error: null };
    case "ROLES_DELETE_OK":
      return { ...state, deleting: false };
    case "ROLES_DELETE_ERR":
      return { ...state, deleting: false, error: action.error };

    default:
      return state;
  }
}
