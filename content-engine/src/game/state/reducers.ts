import { combineReducers } from "redux";
import { ActionType, getType, StateType } from "typesafe-actions";

import { StatementInstance } from "../../types";
import markersReducer from "./reducers/markers-reducer";
import turtleReducer from "./reducers/turtle-reducer";

export const activeStatements = (
  state: StatementInstance[] = [],
  action: GameAction
): StatementInstance[] => {
  switch (action.type) {
    case getType(actions.updateStatement):
      return [...state, action.payload];

    case getType(actions.removeStatement):
      return state.filter(statement => statement.id === action.payload.id);

    default:
      return state;
  }
};

export const gameReducer = combineReducers({
  activeStatements,
  markers: markersReducer,
  turtle: turtleReducer
});

import * as actions from "./actions";
export type GameAction = ActionType<typeof actions>;
export type GameState = StateType<typeof gameReducer>;
