type State = { loading:boolean; error:string|null; items:any[] };
const initial: State = { loading:false, error:null, items:[] };
export function usersReducer(state:State=initial, action:any): State {
  switch(action.type){
    case "USERS_REQ": return { ...state, loading:true, error:null };
    case "USERS_OK":  return { ...state, loading:false, items: action.payload || [] };
    case "USERS_ERR": return { ...state, loading:false, error: action.error };
    default: return state;
  }
}
