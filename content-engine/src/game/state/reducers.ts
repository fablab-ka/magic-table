import { combineReducers } from "redux";
import { ActionType, getType, StateType } from "typesafe-actions";

import { StatementInstance } from "../../types";
import statements from "../statements";
import markersReducer from "./reducers/markers-reducer";
import turtleReducer from "./reducers/turtle-reducer";

export const activeStatements = (
  state: StatementInstance[] = [],
  action: GameAction
): StatementInstance[] => {
  switch (action.type) {
    case getType(actions.updateMarkers):
      return action.payload
        .filter(marker => !!statements[marker.ids[0]])
        .map(marker => ({
          id: marker.ids[0],
          position: {
            x: marker.transform[0][2], // TODO use position2d when available
            y: marker.transform[1][2]
          },
          statement: statements[marker.ids[0]]
        }));

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
