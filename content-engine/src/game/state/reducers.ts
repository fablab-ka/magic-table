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
        .filter(marker => !!statements[marker.id])
        .map(marker => ({
          id: marker.id,
          position: {
            x: marker.corners[0][0], // TODO use position2d when available
            y: marker.corners[0][1]
          },
          statement: statements[marker.id]
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
