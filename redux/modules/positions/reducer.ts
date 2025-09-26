import {
  POSITIONS_REQ,
  POSITIONS_OK,
  POSITIONS_ERR,
  POSITIONS_CREATE_REQ,
  POSITIONS_CREATE_OK,
  POSITIONS_CREATE_ERR,
  POSITIONS_UPDATE_REQ,
  POSITIONS_UPDATE_OK,
  POSITIONS_UPDATE_ERR,
  POSITIONS_DELETE_REQ,
  POSITIONS_DELETE_OK,
  POSITIONS_DELETE_ERR,
} from "./actions";

const initialState = {
  items: [],
  loading: false,
  error: null,
};

export const positionsReducer = (state = initialState, action: any) => {
  switch (action.type) {
    case POSITIONS_REQ:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case POSITIONS_OK:
      return {
        ...state,
        loading: false,
        items: action.payload,
      };
    case POSITIONS_ERR:
      return {
        ...state,
        loading: false,
        error: action.error,
      };
    case POSITIONS_CREATE_REQ:
    case POSITIONS_UPDATE_REQ:
    case POSITIONS_DELETE_REQ:
      return {
        ...state,
        loading: true,
      };
    case POSITIONS_CREATE_OK:
    case POSITIONS_UPDATE_OK:
    case POSITIONS_DELETE_OK:
      return {
        ...state,
        loading: false,
      };
    case POSITIONS_CREATE_ERR:
    case POSITIONS_UPDATE_ERR:
    case POSITIONS_DELETE_ERR:
      return {
        ...state,
        loading: false,
        error: action.error,
      };
    default:
      return state;
  }
};