import { applyMiddleware, createStore, Store } from "redux";
import logger from "redux-logger";

import { gameReducer, GameState } from "./reducers";

export function configureStore(initialState?: GameState): Store<GameState> {
  const result = createStore(gameReducer, applyMiddleware(logger));

  return result;
}

const store = configureStore();

export default store;
