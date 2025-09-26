type State = {
  items: any[];
  error: string | null;
  loading: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  users: { [branchId: string]: any[] }; // Store users for each branch
  assigning: boolean;
};

const initial: State = {
  items: [],
  error: null,
  loading: false,
  creating: false,
  updating: false,
  deleting: false,
  users: {},
  assigning: false
};

export function branchesReducer(state: State = initial, action: any): State {
  switch(action.type){
    case "BRANCHES_REQ":
      return { ...state, loading: true, error: null };
    case "BRANCHES_OK":
      return { ...state, loading: false, items: action.payload };
    case "BRANCHES_ERR":
      return { ...state, loading: false, error: action.error };

    case "BRANCHES_CREATE_REQ":
      return { ...state, creating: true, error: null };
    case "BRANCHES_CREATE_OK":
      return { ...state, creating: false };
    case "BRANCHES_CREATE_ERR":
      return { ...state, creating: false, error: action.error };

    case "BRANCHES_UPDATE_REQ":
      return { ...state, updating: true, error: null };
    case "BRANCHES_UPDATE_OK":
      return { ...state, updating: false };
    case "BRANCHES_UPDATE_ERR":
      return { ...state, updating: false, error: action.error };

    case "BRANCHES_DELETE_REQ":
      return { ...state, deleting: true, error: null };
    case "BRANCHES_DELETE_OK":
      return { ...state, deleting: false };
    case "BRANCHES_DELETE_ERR":
      return { ...state, deleting: false, error: action.error };
      
    case "BRANCH_USERS_REQ":
      return { ...state, loading: true, error: null };
    case "BRANCH_USERS_OK":
      return {
        ...state,
        loading: false,
        users: {
          ...state.users,
          [action.payload.branchId]: action.payload.users
        }
      };
    case "BRANCH_USERS_ERR":
      return { ...state, loading: false, error: action.error };
      
    case "ASSIGN_USERS_REQ":
      return { ...state, assigning: true, error: null };
    case "ASSIGN_USERS_OK":
      return { ...state, assigning: false };
    case "ASSIGN_USERS_ERR":
      return { ...state, assigning: false, error: action.error };
      
    default:
      return state;
  }
}
